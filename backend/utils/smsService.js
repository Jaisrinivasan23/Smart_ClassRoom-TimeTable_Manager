import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

let twilioClient = null;

// Phone number formatting to E.164 standard
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it doesn't start with +, add country code
  if (!phone.startsWith('+')) {
    // Assume US if no country code provided
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    return '+' + cleaned;
  }
  
  return phone;
};

// SMS templates
export const smsTemplates = {
  newRequest: (requestType) => `Smart Classroom: New ${requestType} request received. Please check the app for details.`,
  
  classChange: () => `Smart Classroom: Your class assignment has been updated. Please check the app.`,
  
  staffChange: () => `Smart Classroom: Staff assignment has been updated. Please check the app.`,
  
  generic: (message) => message
};

// Initialize Twilio client
export const initializeSMSService = () => {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (accountSid && authToken) {
      twilioClient = twilio(accountSid, authToken);
    }
  }
  return twilioClient;
};

// Send SMS
export const sendSMS = async (to, message) => {
  try {
    if (!twilioClient) {
      initializeSMSService();
    }

    if (!twilioClient) {
      return {
        success: false,
        error: 'Twilio not configured'
      };
    }

    // Override recipient if TEST_MODE is enabled
    let finalPhone = to;
    if (process.env.TEST_MODE === 'true') {
      finalPhone = process.env.TEST_PHONE_NUMBER || to;
      console.log(`[TEST_MODE] Redirecting SMS from ${to} to ${finalPhone}`);
    }

    const formattedPhone = formatPhoneNumber(finalPhone);
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    const result = await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone
    });

    console.log(`✅ SMS sent successfully to ${formattedPhone} - Message SID: ${result.sid}`);
    return {
      success: true,
      messageSid: result.sid,
      status: result.status,
      sentTo: formattedPhone
    };
  } catch (error) {
    console.error('❌ SMS send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  initializeSMSService,
  sendSMS,
  formatPhoneNumber,
  smsTemplates
};
