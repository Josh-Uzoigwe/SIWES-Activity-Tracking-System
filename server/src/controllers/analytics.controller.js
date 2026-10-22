const prisma = require('../config/db');

exports.getAnalytics = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let studentWhere = {};
    let placementWhere = {};
    let logWhere = {};

    if (userRole === 'COORDINATOR') {
      const coordinator = await prisma.supervisor.findUnique({
        where: { supervisor_id: req.user.id }
      });
      
      studentWhere.institution = coordinator.institution;
      
      // For placements and logs, we need to join or filter based on student's institution.
      // Prisma doesn't support deep filtering across relations perfectly for simple counts,
      // so we can fetch the student IDs first.
      const students = await prisma.student.findMany({
        where: { institution: coordinator.institution },
        select: { student_id: true }
      });
      
      const studentIds = students.map(s => s.student_id);
      placementWhere.student_id = { in: studentIds };
      logWhere.student_id = { in: studentIds };
      
    } else if (userRole === 'ITF') {
      // System-wide, leave where clauses empty
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized for analytics' });
    }

    // Run queries in parallel
    const [
      totalStudents,
      totalPlacements,
      totalLogs,
      approvedLogs
    ] = await Promise.all([
      prisma.student.count({ where: studentWhere }),
      prisma.placement.count({ where: placementWhere }),
      prisma.activityLog.count({ where: logWhere }),
      prisma.activityLog.count({ where: { ...logWhere, status: 'approved' } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalPlacements,
        totalLogs,
        approvedLogs
      }
    });
  } catch (error) {
    next(error);
  }
};
