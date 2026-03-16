const nodemailer = require('nodemailer');

const sendOTPEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const mailOptions = {
    from: `"ARISE Organization" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset OTP - ARISE',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="font-size: 2rem; font-weight: 800; letter-spacing: 6px;
                     background: linear-gradient(135deg, #3366FF, #6B2FBF);
                     -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                     margin: 0;">ARISE</h1>
          <p style="color: #636e72; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 4px 0 0;">Organization Management System</p>
        </div>

        <div style="background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <h2 style="color: #2d3436; font-size: 20px; font-weight: 700; margin: 0 0 12px;">Password Reset Request</h2>
          <p style="color: #636e72; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
            We received a request to reset your password. Use the OTP below to proceed. It expires in <strong>10 minutes</strong>.
          </p>

          <div style="text-align: center; background: linear-gradient(135deg, #3366FF, #6B2FBF);
                      border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: rgba(255,255,255,0.8); font-size: 12px; letter-spacing: 2px;
                      text-transform: uppercase; margin: 0 0 8px;">Your OTP Code</p>
            <span style="color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: 12px;">${otp}</span>
          </div>

          <p style="color: #b2bec3; font-size: 13px; text-align: center; margin: 0;">
            If you did not request this, please ignore this email.
          </p>
        </div>

        <p style="text-align: center; color: #b2bec3; font-size: 12px; margin-top: 24px;">
          &copy; ${new Date().getFullYear()} ARISE Organization. All rights reserved.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};


const sendEventReminderEmail = async (toEmail, toName, event) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const STATUS_COLORS = {
    Planning:  '#8b5cf6',
    Upcoming:  '#3366FF',
    Ongoing:   '#059669',
    Completed: '#6b7280',
    Cancelled: '#ef4444',
  };
  const statusColor = STATUS_COLORS[event.status] || '#3366FF';

  const mailOptions = {
    from: `"ARISE Organization" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Reminder: "${event.title}" is happening in 7 days — ARISE`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="font-size: 2rem; font-weight: 800; letter-spacing: 6px; color: #3366FF; margin: 0;">ARISE</h1>
          <p style="color: #636e72; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 4px 0 0;">Organization Management System</p>
        </div>
        <div style="background: #ffffff; border-radius: 14px; padding: 32px; box-shadow: 0 2px 10px rgba(0,0,0,0.08);">
          <p style="color: #636e72; font-size: 14px; margin: 0 0 6px;">Hi <strong style="color: #2d3436;">${toName}</strong>,</p>
          <p style="color: #636e72; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            This is a reminder that the following event is scheduled <strong>7 days from now</strong>. Please ensure all preparations are in order.
          </p>
          <div style="background: #f8f9fa; border-left: 4px solid ${statusColor}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <span style="font-size: 11px; font-weight: 700; color: ${statusColor}; text-transform: uppercase; letter-spacing: 1px;">${event.status}</span>
            <h2 style="color: #2d3436; font-size: 20px; font-weight: 800; margin: 8px 0 14px;">${event.title}</h2>
            <p style="color: #636e72; font-size: 13px; margin: 0 0 6px;"><strong style="color: #2d3436;">Date:</strong> ${eventDate}</p>
            <p style="color: #636e72; font-size: 13px; margin: 0 0 6px;"><strong style="color: #2d3436;">Venue:</strong> ${event.venue}</p>
            ${event.description ? `<p style="color: #636e72; font-size: 13px; margin: 6px 0 0;"><strong style="color: #2d3436;">Notes:</strong> ${event.description}</p>` : ''}
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            You are receiving this because you are an Admin or President of ARISE Organization.
          </p>
        </div>
        <p style="text-align: center; color: #b2bec3; font-size: 12px; margin-top: 24px;">
          &copy; ${new Date().getFullYear()} ARISE Organization. All rights reserved.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendEventReminderEmail };
