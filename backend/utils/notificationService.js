import dotenv from 'dotenv';
import { sendEmail, emailTemplates, initializeEmailService } from './emailService.js';
import { sendSMS, smsTemplates, initializeSMSService } from './smsService.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import User from '../models/User.js';

dotenv.config();

// Get notification recipients based on notification type
export const getNotificationRecipients = async (notificationType) => {
  try {
    // Check if TEST_MODE is enabled
    if (process.env.TEST_MODE === 'true') {
      return {
        email: [process.env.TEST_EMAIL_TO || 'test@example.com'],
        phone: [process.env.TEST_PHONE_NUMBER || '+1234567890']
      };
    }

    // Check if sending to all roles
    if (process.env.SEND_TO_ALL_ROLES === 'true') {
      const faculty = await Faculty.find({}, 'email phone name').catch(() => []);
      const students = await Student.find({}, 'email phone name').catch(() => []);
      const admins = await User.find({}, 'email phone name').catch(() => []);

      return {
        email: [
          ...faculty.map(f => f.email),
          ...students.map(s => s.email),
          ...admins.map(a => a.email)
        ].filter(Boolean),
        phone: [
          ...faculty.map(f => f.phone),
          ...students.map(s => s.phone),
          ...admins.map(a => a.phone)
        ].filter(Boolean)
      };
    }

    // Default: send to admins
    const admins = await User.find({}, 'email phone name').catch(() => []);
    return {
      email: admins.map(a => a.email).filter(Boolean),
      phone: admins.map(a => a.phone).filter(Boolean)
    };
  } catch (error) {
    console.error('Error getting notification recipients:', error);
    return {
      email: [],
      phone: []
    };
  }
};

// Send complete notification (email + SMS)
export const sendCompleteNotification = async (
  notificationType,
  notificationData,
  details = ''
) => {
  try {
    const recipients = await getNotificationRecipients(notificationType);
    
    let emailSubject = '';
    let emailTemplate = null;
    let smsMessage = '';

    // Get appropriate templates based on notification type
    switch (notificationType) {
      case 'leave_request':
        emailTemplate = emailTemplates.newRequest('Admin', 'Leave Request', details);
        smsMessage = smsTemplates.newRequest('Leave Request');
        break;
      case 'room_change_request':
        emailTemplate = emailTemplates.newRequest('Admin', 'Room Change Request', details);
        smsMessage = smsTemplates.newRequest('Room Change Request');
        break;
      case 'class_change':
        emailTemplate = emailTemplates.classChange('Recipient', details);
        smsMessage = smsTemplates.classChange();
        break;
      case 'staff_change':
        emailTemplate = emailTemplates.staffChange('Recipient', details);
        smsMessage = smsTemplates.staffChange();
        break;
      default:
        emailTemplate = emailTemplates.generic('Notification', details);
        smsMessage = 'Smart Classroom: You have a new notification.';
    }

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      smsSent: 0,
      smsFailed: 0
    };

    // Send emails
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' && recipients.email.length > 0) {
      for (const email of recipients.email) {
        try {
          const result = await sendEmail(email, emailTemplate.subject, emailTemplate.html);
          if (result.success) {
            results.emailsSent++;
          } else {
            results.emailsFailed++;
          }
        } catch (error) {
          results.emailsFailed++;
        }
      }
    }

    // Send SMS
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true' && recipients.phone.length > 0) {
      initializeSMSService();
      for (const phone of recipients.phone) {
        try {
          const result = await sendSMS(phone, smsMessage);
          if (result.success) {
            results.smsSent++;
          } else {
            results.smsFailed++;
          }
        } catch (error) {
          results.smsFailed++;
        }
      }
    }

    return {
      success: true,
      results: results
    };
  } catch (error) {
    console.error('Error sending complete notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send to specific recipient list
export const sendNotificationToRecipients = async (
  recipients,
  subject,
  htmlContent,
  smsMessage
) => {
  try {
    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      smsSent: 0,
      smsFailed: 0
    };

    // Send emails
    if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' && recipients.email) {
      for (const email of recipients.email) {
        try {
          const result = await sendEmail(email, subject, htmlContent);
          if (result.success) {
            results.emailsSent++;
          } else {
            results.emailsFailed++;
          }
        } catch (error) {
          results.emailsFailed++;
        }
      }
    }

    // Send SMS
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true' && recipients.phone && smsMessage) {
      initializeSMSService();
      for (const phone of recipients.phone) {
        try {
          const result = await sendSMS(phone, smsMessage);
          if (result.success) {
            results.smsSent++;
          } else {
            results.smsFailed++;
          }
        } catch (error) {
          results.smsFailed++;
        }
      }
    }

    return {
      success: true,
      results: results
    };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getNotificationRecipients,
  sendCompleteNotification,
  sendNotificationToRecipients
};
