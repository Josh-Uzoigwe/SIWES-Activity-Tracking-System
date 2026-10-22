const prisma = require('../config/db');
const { sendEmail } = require('./email.service');

/**
 * Creates an in-app notification and optionally sends an email
 */
exports.createNotification = async ({
  recipient_type, // 'student' or 'supervisor'
  recipient_id,
  message,
  related_activity_id,
  email_subject,
  email_text
}) => {
  try {
    // 1. Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        recipient_type,
        recipient_id,
        message,
        related_activity_id
      }
    });

    // 2. Fetch email address based on recipient_type
    let recipientEmail = null;
    if (recipient_type === 'student') {
      const student = await prisma.student.findUnique({
        where: { student_id: recipient_id },
        select: { email: true }
      });
      recipientEmail = student?.email;
    } else if (recipient_type === 'supervisor') {
      const supervisor = await prisma.supervisor.findUnique({
        where: { supervisor_id: recipient_id },
        select: { email: true }
      });
      recipientEmail = supervisor?.email;
    }

    // 3. Send email if requested
    if (recipientEmail && email_subject && email_text) {
      await sendEmail(recipientEmail, email_subject, email_text);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
