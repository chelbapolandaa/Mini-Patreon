const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Creator Platform" <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.email}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Creator Platform! 🎉</h2>
      <p>Hi ${user.name},</p>
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>Start exploring creators and subscribe to get exclusive content.</p>
      <br>
      <p>Best regards,<br>The Creator Platform Team</p>
    </div>
  `;
  
  await sendEmail({
    email: user.email,
    subject: 'Welcome to Creator Platform!',
    html
  });
};

module.exports = { sendEmail, sendWelcomeEmail };