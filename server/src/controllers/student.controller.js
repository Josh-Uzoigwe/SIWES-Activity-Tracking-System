const prisma = require('../config/db');

exports.getStudents = async (req, res, next) => {
  try {
    let whereClause = {};
    const userRole = req.user.role;

    if (userRole === 'SCHOOL' || userRole === 'INDUSTRY') {
      // Supervisors see students assigned to them via Placements
      const placements = await prisma.placement.findMany({
        where: {
          OR: [
            { school_supervisor_id: req.user.id },
            { industry_supervisor_id: req.user.id }
          ]
        },
        select: { student_id: true }
      });
      const assignedIds = placements.map(p => p.student_id);
      whereClause.student_id = { in: assignedIds };

    } else if (userRole === 'COORDINATOR') {
      // Coordinator sees all students in their institution
      const coordinator = await prisma.supervisor.findUnique({
        where: { supervisor_id: req.user.id },
        select: { institution: true }
      });
      if (coordinator && coordinator.institution) {
        whereClause.institution = coordinator.institution;
      } else {
        return res.status(403).json({ success: false, message: 'Coordinator institution not set' });
      }

    } else if (userRole === 'ITF') {
      // ITF sees all students (whereClause stays empty)
    } else if (userRole === 'STUDENT') {
      // Optional: students might query themselves, but we have /auth/me. 
      // Strictly speaking, students shouldn't list other students.
      return res.status(403).json({ success: false, message: 'Students cannot list students' });
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      select: {
        student_id: true,
        matric_no: true,
        full_name: true,
        email: true,
        department: true,
        institution: true,
        year_of_study: true,
        status: true,
        bank_name: true,
        account_number: true,
        account_name: true,
        created_at: true,
        // Include placement info with industry supervisor details
        placements: {
          select: {
            placement_id: true,
            company_name: true,
            address: true,
            start_date: true,
            end_date: true,
            industry_supervisor_name: true,
            industry_supervisor_email: true,
            industry_supervisor_phone: true,
            school_supervisor: {
              select: { supervisor_id: true, full_name: true, email: true }
            },
            industry_supervisor: {
              select: { supervisor_id: true, full_name: true, email: true }
            }
          }
        },
        activity_logs: {
          select: {
            activity_id: true,
            status: true,
            industry_endorsed: true
          }
        },
        final_reports: {
          select: {
            report_id: true,
            file_url: true,
            stipend_verified: true,
            submitted_at: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student_id = parseInt(id, 10);
    const userRole = req.user.role;

    const student = await prisma.student.findUnique({
      where: { student_id },
      include: {
        placements: true
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Role-based visibility check
    if (userRole === 'SCHOOL' || userRole === 'INDUSTRY') {
      const placement = await prisma.placement.findFirst({
        where: {
          student_id,
          OR: [
            { school_supervisor_id: req.user.id },
            { industry_supervisor_id: req.user.id }
          ]
        }
      });
      if (!placement) {
         return res.status(403).json({ success: false, message: 'Not authorized to view this student' });
      }
    } else if (userRole === 'COORDINATOR') {
      const coordinator = await prisma.supervisor.findUnique({ where: { supervisor_id: req.user.id } });
      if (student.institution !== coordinator.institution) {
         return res.status(403).json({ success: false, message: 'Not authorized to view students outside your institution' });
      }
    } else if (userRole === 'STUDENT' && req.user.id !== student_id) {
       return res.status(403).json({ success: false, message: 'Students can only view their own profile' });
    }

    // Omit password hash
    const { password_hash, ...safeStudent } = student;

    res.status(200).json({
      success: true,
      data: safeStudent
    });
  } catch (error) {
    next(error);
  }
};

// Coordinator clears/vets student for SIWES
exports.clearStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student_id = parseInt(id, 10);

    const coordinator = await prisma.supervisor.findUnique({
      where: { supervisor_id: req.user.id }
    });

    const student = await prisma.student.findUnique({
      where: { student_id }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Normalize institution comparison (ignore case, whitespace, and common acronyms)
    const normalize = (str) => (str || '').trim().toLowerCase();
    const coordInst = normalize(coordinator?.institution);
    const studInst = normalize(student?.institution);

    if (coordInst && studInst && coordInst !== studInst) {
      const isUnnMatch = (coordInst.includes('nigeria') || coordInst.includes('unn')) && (studInst.includes('nigeria') || studInst.includes('unn'));
      const isUnilorinMatch = (coordInst.includes('ilorin') || coordInst.includes('unilorin')) && (studInst.includes('ilorin') || studInst.includes('unilorin'));

      if (!isUnnMatch && !isUnilorinMatch) {
        return res.status(403).json({ success: false, message: `Cannot clear student outside your institution (${student.institution})` });
      }
    }

    if (student.status === 'cleared') {
      return res.status(200).json({
        success: true,
        message: 'Student is already cleared for SIWES',
        data: student
      });
    }

    const updated = await prisma.student.update({
      where: { student_id },
      data: { status: 'cleared' }
    });

    try {
      const { createNotification } = require('../services/notification.service');
      await createNotification({
        recipient_type: 'student',
        recipient_id: student_id,
        message: 'Your institutional SIWES clearance has been approved! You can now log daily workplace activities.',
        email_subject: 'SIWES Institutional Clearance Approved',
        email_text: `Congratulations! Your SIWES Coordinator at ${coordinator?.institution || 'your institution'} has approved your institutional clearance. Your daily activity logbook is now active.`
      });
    } catch (notifErr) {
      console.error('Non-critical notification error during clearance:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Student cleared for SIWES successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Coordinator rejects/flags student clearance
exports.rejectStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const student_id = parseInt(id, 10);

    const coordinator = await prisma.supervisor.findUnique({
      where: { supervisor_id: req.user.id }
    });

    const student = await prisma.student.findUnique({
      where: { student_id }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const normalize = (str) => (str || '').trim().toLowerCase();
    const coordInst = normalize(coordinator?.institution);
    const studInst = normalize(student?.institution);

    if (coordInst && studInst && coordInst !== studInst) {
      const isUnnMatch = (coordInst.includes('nigeria') || coordInst.includes('unn')) && (studInst.includes('nigeria') || studInst.includes('unn'));
      const isUnilorinMatch = (coordInst.includes('ilorin') || coordInst.includes('unilorin')) && (studInst.includes('ilorin') || studInst.includes('unilorin'));

      if (!isUnnMatch && !isUnilorinMatch) {
        return res.status(403).json({ success: false, message: 'Cannot flag student outside your institution' });
      }
    }

    const updated = await prisma.student.update({
      where: { student_id },
      data: { status: 'rejected' }
    });

    try {
      const { createNotification } = require('../services/notification.service');
      await createNotification({
        recipient_type: 'student',
        recipient_id: student_id,
        message: `Your SIWES clearance was not approved: ${reason || 'Please report to your institutional SIWES Coordinator.'}`,
        email_subject: 'SIWES Clearance Status Update',
        email_text: `Your SIWES clearance at ${coordinator?.institution || 'your institution'} could not be approved. Reason: ${reason || 'Please report to the SIWES Directorate.'}`
      });
    } catch (notifErr) {
      console.error('Non-critical notification error during rejection:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Student clearance flagged',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// Student updates their official commercial bank account details for ITF stipend disbursement
exports.updateBankDetails = async (req, res, next) => {
  try {
    const { bank_name, account_number, account_name } = req.body;
    const student_id = req.user.id;

    if (!bank_name || !account_number || !account_name) {
      return res.status(400).json({
        success: false,
        message: 'Bank name, 10-digit account number, and account name are required'
      });
    }

    const cleanAccNo = String(account_number).trim();
    if (!/^\d{10}$/.test(cleanAccNo)) {
      return res.status(400).json({
        success: false,
        message: 'Account number must be exactly 10 digits (NUBAN)'
      });
    }

    const updated = await prisma.student.update({
      where: { student_id },
      data: {
        bank_name: bank_name.trim(),
        account_number: cleanAccNo,
        account_name: account_name.trim()
      },
      select: {
        student_id: true,
        full_name: true,
        bank_name: true,
        account_number: true,
        account_name: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Official bank details updated successfully for ITF stipend disbursement',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

