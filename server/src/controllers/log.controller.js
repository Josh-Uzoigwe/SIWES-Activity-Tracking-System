const prisma = require('../config/db');
const { createNotification } = require('../services/notification.service');

// Helper to check if date is within allowed range (no future, max 3 days past)
// Incorporates a 24-hour buffer ahead of UTC to accommodate users in timezones ahead of UTC (e.g., WAT / Nigeria UTC+1)
const isValidLogDate = (dateString) => {
  let year, month, day;
  if (typeof dateString === 'string' && dateString.includes('-')) {
    const parts = dateString.split('T')[0].split('-').map(Number);
    year = parts[0];
    month = parts[1] - 1;
    day = parts[2];
  } else {
    const d = new Date(dateString);
    year = d.getUTCFullYear();
    month = d.getUTCMonth();
    day = d.getUTCDate();
  }

  const logDateUTC = new Date(Date.UTC(year, month, day));
  const now = new Date();
  
  // Allow a 24-hour buffer ahead of UTC to account for timezones ahead of UTC
  const nowMaxFuture = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const maxFutureUTC = new Date(Date.UTC(nowMaxFuture.getUTCFullYear(), nowMaxFuture.getUTCMonth(), nowMaxFuture.getUTCDate()));

  if (logDateUTC > maxFutureUTC) return false;

  const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffDays = Math.floor((nowUTC - logDateUTC) / (1000 * 60 * 60 * 24));

  return diffDays <= 3;
};

// Create a new activity log
exports.createLog = async (req, res, next) => {
  try {
    const { log_date, description, skills_acquired, evidence_url, original_log_id } = req.body;
    
    if (!log_date || !description) {
      return res.status(400).json({ success: false, message: 'log_date and description are required' });
    }

    if (typeof description !== 'string' || description.trim().length > 5000) {
      return res.status(400).json({ success: false, message: 'Description must not exceed 5,000 characters' });
    }

    if (skills_acquired && (typeof skills_acquired !== 'string' || skills_acquired.length > 1000)) {
      return res.status(400).json({ success: false, message: 'Skills acquired must not exceed 1,000 characters' });
    }

    // Validate evidence_url must be a server-local /uploads/ path (no external URLs)
    if (evidence_url && !evidence_url.startsWith('/uploads/')) {
      return res.status(400).json({ success: false, message: 'evidence_url must reference a server-uploaded file' });
    }

    if (!isValidLogDate(log_date)) {
      return res.status(400).json({ success: false, message: 'log_date cannot be in the future or more than 3 days in the past' });
    }

    const student_id = req.user.id;

    // Check institutional clearance
    const student = await prisma.student.findUnique({
      where: { student_id }
    });
    if (student && student.status !== 'cleared') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending institutional SIWES clearance by your coordinator before you can submit activity logs.'
      });
    }

    // Handle resubmission logic
    if (original_log_id) {
      const originalLog = await prisma.activityLog.findUnique({
        where: { activity_id: original_log_id }
      });

      if (!originalLog || originalLog.student_id !== student_id) {
        return res.status(400).json({ success: false, message: 'Invalid original_log_id' });
      }

      if (originalLog.status !== 'rejected') {
        return res.status(400).json({ success: false, message: 'Can only resubmit rejected logs' });
      }
    }

    const log = await prisma.activityLog.create({
      data: {
        student_id,
        log_date: new Date(log_date),
        description,
        skills_acquired,
        evidence_url,
        original_log_id: original_log_id || null,
        // status is "pending" by default
        // submitted_at is set by DB default(now())
      }
    });

    // Notify supervisors
    const placement = await prisma.placement.findFirst({
      where: { student_id },
      select: { school_supervisor_id: true, industry_supervisor_id: true }
    });

    if (placement) {
      const message = `A new log has been submitted for review.`;
      const email_subject = 'New SIWES Log Submitted';
      const email_text = 'A student has submitted a new log for review. Please log in to your dashboard to review it.';
      
      if (placement.school_supervisor_id) {
        await createNotification({
          recipient_type: 'supervisor',
          recipient_id: placement.school_supervisor_id,
          message,
          related_activity_id: log.activity_id,
          email_subject,
          email_text
        });
      }
      if (placement.industry_supervisor_id) {
        await createNotification({
          recipient_type: 'supervisor',
          recipient_id: placement.industry_supervisor_id,
          message,
          related_activity_id: log.activity_id,
          email_subject,
          email_text
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Log submitted successfully',
      data: log
    });
  } catch (error) {
    next(error);
  }
};

// Get logs (scoped by role)
exports.getLogs = async (req, res, next) => {
  try {
    const { status, studentId } = req.query;
    let whereClause = {};

    if (req.user.role === 'STUDENT') {
      // Student can only see their own logs
      whereClause.student_id = req.user.id;
    } else if (req.user.role === 'SCHOOL' || req.user.role === 'INDUSTRY') {
      // Supervisor can see logs for their assigned students
      if (studentId) {
        whereClause.student_id = parseInt(studentId, 10);
      }
      
      // Additional safety: ensure the student is actually assigned to this supervisor
      // This requires joining placements. We'll add this check inside the query or via a middleware.
      const assignedPlacements = await prisma.placement.findMany({
        where: {
          OR: [
            { school_supervisor_id: req.user.id },
            { industry_supervisor_id: req.user.id }
          ]
        },
        select: { student_id: true }
      });
      
      const assignedStudentIds = assignedPlacements.map(p => p.student_id);
      
      if (studentId && !assignedStudentIds.includes(parseInt(studentId, 10))) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this student\'s logs' });
      }

      if (!studentId) {
        whereClause.student_id = { in: assignedStudentIds };
      }
    } else {
      // Coordinator or ITF could potentially see more based on further logic, but for Phase 3 focus is on Student.
      if (studentId) {
         whereClause.student_id = parseInt(studentId, 10);
      }
    }

    if (status) {
      whereClause.status = status;
    }

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { log_date: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// Get specific log by ID
exports.getLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await prisma.activityLog.findUnique({
      where: { activity_id: parseInt(id, 10) },
      include: {
        revisions: true,
        reviewer: {
          select: { full_name: true, role: true }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    // Role check: If student, must own the log
    if (req.user.role === 'STUDENT' && log.student_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
};

// Review Log (School Supervisor)
exports.reviewLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, supervisor_comment } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    if (status === 'rejected' && !supervisor_comment) {
       return res.status(400).json({ success: false, message: 'Comment is required when rejecting a log' });
    }

    const log = await prisma.activityLog.findUnique({
      where: { activity_id: parseInt(id, 10) }
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    // Verify supervisor is actually assigned to this student
    const placement = await prisma.placement.findFirst({
      where: {
        student_id: log.student_id,
        school_supervisor_id: req.user.id
      }
    });

    if (!placement) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this student\'s logs' });
    }

    const updatedLog = await prisma.activityLog.update({
      where: { activity_id: parseInt(id, 10) },
      data: {
        status,
        supervisor_comment,
        supervisor_id: req.user.id,
        reviewed_at: new Date(),
        ...(status === 'rejected' ? { industry_endorsed: false } : {})
      }
    });

    // Notify student
    await createNotification({
      recipient_type: 'student',
      recipient_id: updatedLog.student_id,
      message: `Your log for ${new Date(updatedLog.log_date).toLocaleDateString()} has been ${status}.`,
      related_activity_id: updatedLog.activity_id,
      email_subject: `Log ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      email_text: `Your submitted log has been ${status} by your school supervisor.${status === 'rejected' ? ' Please review the comments and resubmit.' : ''}`
    });

    res.status(200).json({
      success: true,
      message: `Log successfully ${status}`,
      data: updatedLog
    });
  } catch (error) {
    next(error);
  }
};

// Endorse Log (Industry Supervisor)
exports.endorseLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await prisma.activityLog.findUnique({
      where: { activity_id: parseInt(id, 10) }
    });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    if (log.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Cannot endorse an activity log that has been rejected by the academic supervisor. The student must resubmit a revised entry first.'
      });
    }

    // Verify supervisor is actually assigned to this student
    const placement = await prisma.placement.findFirst({
      where: {
        student_id: log.student_id,
        industry_supervisor_id: req.user.id
      }
    });

    if (!placement) {
      return res.status(403).json({ success: false, message: 'Not authorized to endorse this student\'s logs' });
    }

    const updatedLog = await prisma.activityLog.update({
      where: { activity_id: parseInt(id, 10) },
      data: {
        industry_endorsed: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Log successfully endorsed',
      data: updatedLog
    });
  } catch (error) {
    next(error);
  }
};
