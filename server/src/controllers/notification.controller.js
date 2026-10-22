const prisma = require('../config/db');

// Get all notifications for current user
exports.getNotifications = async (req, res, next) => {
  try {
    const recipient_type = req.user.role === 'STUDENT' ? 'student' : 'supervisor';
    const recipient_id = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        recipient_type,
        recipient_id
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recipient_type = req.user.role === 'STUDENT' ? 'student' : 'supervisor';
    const recipient_id = req.user.id;

    const notification = await prisma.notification.findUnique({
      where: { notification_id: parseInt(id, 10) }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient_type !== recipient_type || notification.recipient_id !== recipient_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { notification_id: parseInt(id, 10) },
      data: { is_read: true }
    });

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};
