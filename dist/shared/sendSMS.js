"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sns_1 = require("@aws-sdk/client-sns");
const config_1 = __importDefault(require("../config"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const snsClient = new client_sns_1.SNSClient({
    region: config_1.default.aws.region || 'us-east-1',
    credentials: {
        accessKeyId: config_1.default.aws.accessKeyId,
        secretAccessKey: config_1.default.aws.secretAccessKey,
    },
});
const sendSMS = async (to, message) => {
    if (!config_1.default.aws.accessKeyId || !config_1.default.aws.secretAccessKey) {
        console.error("❌ AWS Credentials missing in config");
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'SMS configuration missing');
    }
    // Ensure phone number starts with + for AWS SNS international format
    const formattedTo = to.startsWith('+') ? to : `+${to}`;
    try {
        const params = {
            Message: message,
            PhoneNumber: formattedTo,
            MessageAttributes: {
                'AWS.SNS.SMS.SMSType': {
                    DataType: 'String',
                    StringValue: 'Transactional',
                },
            },
        };
        const command = new client_sns_1.PublishCommand(params);
        const result = await snsClient.send(command);
        console.log("✅ SMS sent successfully via AWS SNS:", result.MessageId);
        return {
            invalid: false,
            message: `Message sent successfully to ${to}`,
        };
    }
    catch (error) {
        console.error("❌ AWS SNS SMS Error:", error.message || error);
        // AWS SNS error codes are different from Twilio
        if (error.name === 'InvalidParameterException' && error.message.includes('PhoneNumber')) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid phone number format');
        }
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, error.message || 'Failed to send sms');
    }
};
exports.default = sendSMS;
