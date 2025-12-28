"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailHelper = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../shared/logger");
const transporter = nodemailer_1.default.createTransport({
    host: config_1.default.email.host,
    port: Number(config_1.default.email.port),
    secure: false,
    auth: {
        user: config_1.default.email.user,
        pass: config_1.default.email.pass
    },
});
const sendEmail = async (values) => {
    try {
        const info = await transporter.sendMail({
            from: `"Servi" ${config_1.default.email.from}`,
            to: values.to,
            subject: values.subject,
            html: values.html,
        });
        logger_1.logger.info('Mail send successfully', info.accepted);
    }
    catch (error) {
        logger_1.errorLogger.error('Email', error);
    }
};
exports.emailHelper = {
    sendEmail
};
