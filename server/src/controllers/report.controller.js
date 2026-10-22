const prisma = require('../config/db');
const { createNotification } = require('../services/notification.service');

// Get all final reports (scoped by role)
exports.getReports = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let whereClause = {};

    if (userRole === 'COORDINATOR') {
      const coordinator = await prisma.supervisor.findUnique({
        where: { supervisor_id: req.user.id }
      });
      
      const students = await prisma.student.findMany({
        where: { institution: coordinator.institution },
        select: { student_id: true }
      });
      
      whereClause.student_id = { in: students.map(s => s.student_id) };
      
    } else if (userRole === 'ITF') {
      // System-wide, leave empty
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to view reports' });
    }

    const reports = await prisma.finalReport.findMany({
      where: whereClause,
      include: {
        student: { select: { full_name: true, matric_no: true, institution: true } }
      }
    });

    res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

// Get current student's final report
exports.getMyReport = async (req, res, next) => {
  try {
    const report = await prisma.finalReport.findFirst({
      where: { student_id: req.user.id },
      orderBy: { submitted_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// Upload a final report (Student)
exports.uploadReport = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only students can upload final reports' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file_url = `/uploads/${req.file.filename}`;

    const report = await prisma.finalReport.create({
      data: {
        student_id: req.user.id,
        file_url: file_url,
        // submitted_at defaults to now()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Final report uploaded successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

// Verify report for stipend (ITF Officer)
exports.verifyStipend = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ITF') {
      return res.status(403).json({ success: false, message: 'Only ITF officers can verify stipends' });
    }

    const report = await prisma.finalReport.findUnique({
      where: { report_id: parseInt(id, 10) }
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const updatedReport = await prisma.finalReport.update({
      where: { report_id: parseInt(id, 10) },
      data: {
        stipend_verified: true,
        verified_by: req.user.id,
        verified_at: new Date()
      }
    });

    // Notify student
    await createNotification({
      recipient_type: 'student',
      recipient_id: updatedReport.student_id,
      message: 'Your SIWES final report has been verified by the ITF for stipend payment.',
      email_subject: 'SIWES Stipend Verified',
      email_text: 'Good news! Your SIWES final report has been verified by an ITF officer for your stipend payment.'
    });

    res.status(200).json({
      success: true,
      message: 'Stipend verified successfully',
      data: updatedReport
    });
  } catch (error) {
    next(error);
  }
};
