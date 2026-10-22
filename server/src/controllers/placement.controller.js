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
      return res.status(404).json({ success: false, message: 'Placement not found' });
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
    const { student_id, company_name, address, start_date, end_date } = req.body;

    // Verify the student exists and belongs to the coordinator's institution
    const student = await prisma.student.findUnique({
      where: { student_id: parseInt(student_id, 10) }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const coordinator = await prisma.supervisor.findUnique({
      where: { supervisor_id: req.user.id }
    });

    if (student.institution !== coordinator.institution) {
      return res.status(403).json({ success: false, message: 'Cannot create placement for a student outside your institution' });
    }

    // Check if placement already exists
    const existingPlacement = await prisma.placement.findFirst({
      where: { student_id: parseInt(student_id, 10) }
    });

    if (existingPlacement) {
      return res.status(400).json({ success: false, message: 'Student already has a placement' });
    }

    const placement = await prisma.placement.create({
      data: {
        student_id: parseInt(student_id, 10),
        company_name,
        address,
        start_date: new Date(start_date),
        end_date: new Date(end_date)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Placement created successfully',
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
