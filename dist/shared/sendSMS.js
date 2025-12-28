"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const twilio_1 = __importDefault(require("twilio"));
const config_1 = __importDefault(require("../config"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const client = (0, twilio_1.default)(config_1.default.twilio.accountSid, config_1.default.twilio.authToken);
const sendSMS = async (to, message) => {
    try {
        const result = await client.messages.create({
            body: message,
            from: config_1.default.twilio.twilioNumber,
            to: to,
        });
        console.log("✅ SMS sent successfully:", result.sid);
        return {
            invalid: false,
            message: `Message sent successfully to ${to}`,
        };
    }
    catch (error) {
        console.error("❌ Twilio SMS Error:", error.message || error);
        if (error.code === 21211) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid phone number format');
        }
        if (error.code === 21606) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This number is not verified in your Twilio trial account');
        }
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, error.message || 'Failed to send sms');
    }
};
exports.default = sendSMS;
