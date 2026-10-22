const prisma = require('../config/db');
const { createNotification } = require('../services/notification.service');

// Schedule a visit
exports.scheduleVisit = async (req, res, next) => {
  try {
    const { placement_id, scheduled_date, notes } = req.body;

    if (!placement_id || !scheduled_date) {
      return res.status(400).json({ success: false, message: 'placement_id and scheduled_date are required' });
    }

    // Verify placement exists and supervisor is assigned to it
    const placement = await prisma.placement.findUnique({
      where: { placement_id: parseInt(placement_id, 10) }
    });

    if (!placement) {
      return res.status(404).json({ success: false, message: 'Placement not found' });
    }

    if (
      placement.school_supervisor_id !== req.user.id &&
      placement.industry_supervisor_id !== req.user.id &&
      req.user.role !== 'COORDINATOR'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to schedule a visit for this placement' });
    }

    const visit = await prisma.visit.create({
      data: {
        placement_id: parseInt(placement_id, 10),
        scheduled_by: req.user.id,
        scheduled_date: new Date(scheduled_date),
        notes
        // status defaults to 'scheduled'
      }
    });

    // Notify student
    await createNotification({
      recipient_type: 'student',
      recipient_id: placement.student_id,
      message: `A supervisory visit has been scheduled for ${new Date(scheduled_date).toLocaleDateString()}.`,
      email_subject: 'SIWES Visit Scheduled',
      email_text: `A supervisory visit has been scheduled for your placement on ${new Date(scheduled_date).toLocaleDateString()}. Please ensure you are present.`
    });

    res.status(201).json({
      success: true,
      message: 'Visit scheduled successfully',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

// Get visits for a placement or all visits for a supervisor
exports.getVisits = async (req, res, next) => {
  try {
    const { placementId } = req.query;
    let whereClause = {};

    if (placementId) {
      whereClause.placement_id = parseInt(placementId, 10);
    }

    if (req.user.role === 'STUDENT') {
      // Students can only see visits for their placement
      const placement = await prisma.placement.findFirst({
        where: { student_id: req.user.id }
      });
      if (!placement) {
        return res.status(200).json({ success: true, data: [] });
      }
      
      if (placementId && parseInt(placementId, 10) !== placement.placement_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      whereClause.placement_id = placement.placement_id;
    } else if (req.user.role === 'SCHOOL' || req.user.role === 'INDUSTRY') {
      // Supervisors can see visits they scheduled, or visits for placements they supervise
      // For simplicity, showing all visits for placements they are assigned to
      const placements = await prisma.placement.findMany({
        where: {
          OR: [
            { school_supervisor_id: req.user.id },
            { industry_supervisor_id: req.user.id }
          ]
        },
        select: { placement_id: true }
      });
      
      const placementIds = placements.map(p => p.placement_id);
      
      if (placementId) {
        if (!placementIds.includes(parseInt(placementId, 10))) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      } else {
        whereClause.placement_id = { in: placementIds };
      }
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      orderBy: { scheduled_date: 'asc' },
      include: {
        scheduler: { select: { full_name: true, role: true } }
      }
    });

    res.status(200).json({
      success: true,
      data: visits
    });
  } catch (error) {
    next(error);
  }
};

// Update visit status (mark completed or cancelled)
exports.updateVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be completed or cancelled' });
    }

    const visit = await prisma.visit.findUnique({
      where: { visit_id: parseInt(id, 10) }
    });

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // Only the supervisor who scheduled it (or maybe coordinator) can update it
    if (visit.scheduled_by !== req.user.id && req.user.role !== 'COORDINATOR') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this visit' });
    }

    let updateData = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedVisit = await prisma.visit.update({
      where: { visit_id: parseInt(id, 10) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: `Visit marked as ${status}`,
      data: updatedVisit
    });
  } catch (error) {
    next(error);
  }
};
