"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailHelper = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../shared/logger");
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const ses = new client_sesv2_1.SESv2Client({
    region: config_1.default.aws.ses.region,
    credentials: {
        accessKeyId: config_1.default.aws.accessKeyId,
        secretAccessKey: config_1.default.aws.secretAccessKey
    }
});
const transporter = nodemailer_1.default.createTransport({
    SES: {
        sesClient: ses,
        SendEmailCommand: client_sesv2_1.SendEmailCommand
    }
});
const sendEmail = async (values) => {
    try {
        const info = await transporter.sendMail({
            from: `Txme ${config_1.default.email.from}`,
            to: values.to,
            subject: values.subject,
            html: values.html,
            replyTo: 'oliver@txme.nl',
            headers: {
                'List-Unsubscribe': '<mailto:oliver@txme.nl?subject=unsubscribe>'
            }
        });
        logger_1.logger.info('Mail send successfully', info.messageId);
    }
    catch (error) {
        logger_1.errorLogger.error('Email', error);
        console.error("Detailed SES Error:", error);
    }
};
exports.emailHelper = {
    sendEmail
};
