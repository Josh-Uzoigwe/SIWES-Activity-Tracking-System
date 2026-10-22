const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: '"SIWES Tracker" <noreply@siwes.tracker>',
      to,
      subject,
      text
    });
    console.log('Message sent: %s', info.messageId);
    
    // For ethereal email, we can log the preview URL
    if (process.env.SMTP_HOST === 'smtp.ethereal.email' || !process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
