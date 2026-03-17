import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

// Email templates
export const emailTemplates = {
  newRequest: (recipientName, requestType, details) => ({
    subject: `New ${requestType} Request`,
    html: `
      <h2>New ${requestType} Request</h2>
      <p>Dear ${recipientName},</p>
      <p>A new ${requestType} has been submitted.</p>
      <p><strong>Details:</strong><br/>${details}</p>
      <p>Please log in to the Smart Classroom system to review.</p>
      <p>Best regards,<br/>Smart Classroom Admin</p>
    `
  }),
  
  classChange: (recipientName, details) => ({
    subject: 'Class Assignment Changed',
    html: `
      <h2>Class Assignment Update</h2>
      <p>Dear ${recipientName},</p>
      <p>Your class assignment has been updated.</p>
      <p><strong>Details:</strong><br/>${details}</p>
      <p>Best regards,<br/>Smart Classroom Admin</p>
    `
  }),
  
  staffChange: (recipientName, details) => ({
    subject: 'Staff Assignment Updated',
    html: `
      <h2>Staff Assignment Update</h2>
      <p>Dear ${recipientName},</p>
      <p>A staff assignment has been updated.</p>
      <p><strong>Details:</strong><br/>${details}</p>
      <p>Best regards,<br/>Smart Classroom Admin</p>
    `
  }),

  generic: (subject, message) => ({
    subject: subject,
    html: `
      <p>${message}</p>
      <p>Best regards,<br/>Smart Classroom System</p>
    `
  })
};

// Initialize email service
export const initializeEmailService = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  return transporter;
};

// Send email
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    if (!transporter) {
      initializeEmailService();
    }

    // Override recipient if TEST_MODE is enabled
    let finalRecipient = to;
    if (process.env.TEST_MODE === 'true') {
      finalRecipient = process.env.TEST_EMAIL_TO || to;
      console.log(`[TEST_MODE] Redirecting email from ${to} to ${finalRecipient}`);
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: finalRecipient,
      subject: subject,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${finalRecipient} - Message ID: ${result.messageId}`);
    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
      sentTo: finalRecipient
    };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  initializeEmailService,
  sendEmail,
  emailTemplates
};
