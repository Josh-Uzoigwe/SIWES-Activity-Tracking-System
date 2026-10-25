const prisma = require('../config/db');

exports.getPlacementByStudentId = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // A student can only view their own placement
    if (req.user.role === 'STUDENT' && req.user.id !== parseInt(studentId, 10)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot view another student\'s placement' });
    }

    const placement = await prisma.placement.findFirst({
      where: { student_id: parseInt(studentId, 10) },
      include: {
        school_supervisor: { select: { full_name: true, email: true, department: true } },
        industry_supervisor: { select: { full_name: true, email: true, company: true } }
      }
    });

    if (!placement) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({
      success: true,
      data: placement
    });
  } catch (error) {
    next(error);
  }
};

exports.createPlacement = async (req, res, next) => {
  try {
    let targetStudentId;
    const isStudent = req.user.role === 'STUDENT';

    if (isStudent) {
      targetStudentId = req.user.id;
    } else if (req.user.role === 'COORDINATOR') {
      const { student_id } = req.body;
      if (!student_id) {
        return res.status(400).json({ success: false, message: 'student_id is required' });
      }
      targetStudentId = parseInt(student_id, 10);

      const student = await prisma.student.findUnique({
        where: { student_id: targetStudentId }
      });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const coordinator = await prisma.supervisor.findUnique({
        where: { supervisor_id: req.user.id }
      });
      if (student.institution !== coordinator.institution) {
        return res.status(403).json({ success: false, message: 'Cannot manage placement for a student outside your institution' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Only students and coordinators can register placements' });
    }

    const {
      company_name,
      address,
      start_date,
      end_date,
      industry_supervisor_name,
      industry_supervisor_email,
      industry_supervisor_phone,
      school_supervisor_id,
      industry_supervisor_id
    } = req.body;

    if (!company_name || !address || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Company name, address, start date, and end date are required'
      });
    }

    // Check if student already has a placement — update if exists (upsert)
    const existingPlacement = await prisma.placement.findFirst({
      where: { student_id: targetStudentId }
    });

    let placement;
    if (existingPlacement) {
      const updateData = {
        company_name: company_name.trim(),
        address: address.trim(),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
      };

      if (industry_supervisor_name !== undefined) updateData.industry_supervisor_name = industry_supervisor_name ? industry_supervisor_name.trim() : null;
      if (industry_supervisor_email !== undefined) updateData.industry_supervisor_email = industry_supervisor_email ? industry_supervisor_email.trim() : null;
      if (industry_supervisor_phone !== undefined) updateData.industry_supervisor_phone = industry_supervisor_phone ? industry_supervisor_phone.trim() : null;
      if (!isStudent && school_supervisor_id !== undefined) updateData.school_supervisor_id = school_supervisor_id ? parseInt(school_supervisor_id, 10) : null;
      if (!isStudent && industry_supervisor_id !== undefined) updateData.industry_supervisor_id = industry_supervisor_id ? parseInt(industry_supervisor_id, 10) : null;

      placement = await prisma.placement.update({
        where: { placement_id: existingPlacement.placement_id },
        data: updateData,
        include: {
          school_supervisor: { select: { supervisor_id: true, full_name: true, email: true, department: true } },
          industry_supervisor: { select: { supervisor_id: true, full_name: true, email: true, company: true } }
        }
      });
    } else {
      placement = await prisma.placement.create({
        data: {
          student_id: targetStudentId,
          company_name: company_name.trim(),
          address: address.trim(),
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          industry_supervisor_name: industry_supervisor_name ? industry_supervisor_name.trim() : null,
          industry_supervisor_email: industry_supervisor_email ? industry_supervisor_email.trim() : null,
          industry_supervisor_phone: industry_supervisor_phone ? industry_supervisor_phone.trim() : null,
          ...(!isStudent && school_supervisor_id ? { school_supervisor_id: parseInt(school_supervisor_id, 10) } : {}),
          ...(!isStudent && industry_supervisor_id ? { industry_supervisor_id: parseInt(industry_supervisor_id, 10) } : {})
        },
        include: {
          school_supervisor: { select: { supervisor_id: true, full_name: true, email: true, department: true } },
          industry_supervisor: { select: { supervisor_id: true, full_name: true, email: true, company: true } }
        }
      });
    }

    res.status(existingPlacement ? 200 : 201).json({
      success: true,
      message: existingPlacement ? 'Place of attachment updated successfully' : 'Place of attachment registered successfully',
      data: placement
    });
  } catch (error) {
    next(error);
  }
};

exports.assignSupervisors = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { school_supervisor_id, industry_supervisor_id } = req.body;
    const placementId = parseInt(id, 10);

    const placement = await prisma.placement.findUnique({
      where: { placement_id: placementId },
      include: { student: true }
    });

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    const coordinator = await prisma.supervisor.findUnique({
      where: { supervisor_id: req.user.id }
    });

    if (placement.student.institution !== coordinator.institution) {
      return res.status(403).json({ success: false, message: 'Cannot modify placement for a student outside your institution' });
    }

    // Validate the assigned supervisors if provided
    let updateData = {};
    if (school_supervisor_id) {
      const schoolSup = await prisma.supervisor.findUnique({ where: { supervisor_id: school_supervisor_id } });
      if (!schoolSup || schoolSup.role !== 'SCHOOL') {
        return res.status(400).json({ success: false, message: 'Invalid school supervisor ID' });
      }
      updateData.school_supervisor_id = school_supervisor_id;
    }

    if (industry_supervisor_id) {
      const indSup = await prisma.supervisor.findUnique({ where: { supervisor_id: industry_supervisor_id } });
      if (!indSup || indSup.role !== 'INDUSTRY') {
        return res.status(400).json({ success: false, message: 'Invalid industry supervisor ID' });
      }
      updateData.industry_supervisor_id = industry_supervisor_id;
    }

    const updatedPlacement = await prisma.placement.update({
      where: { placement_id: placementId },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Supervisors assigned successfully',
      data: updatedPlacement
    });
  } catch (error) {
    next(error);
  }
};
