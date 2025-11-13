import twilio from 'twilio';
import config from '../config';
import ApiError from '../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

const sendSMS = async (to: string, message: string) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: config.twilio.twilioNumber,
      to: to,
    });

    console.log("✅ SMS sent successfully:", result.sid);
    return {
      invalid: false,
      message: `Message sent successfully to ${to}`,
    };
  } catch (error: any) {
    console.error("❌ Twilio SMS Error:", error.message || error);
    if (error.code === 21211) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid phone number format');
    }
    if (error.code === 21606) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'This number is not verified in your Twilio trial account');
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message || 'Failed to send sms');
  }
};

export default sendSMS;
