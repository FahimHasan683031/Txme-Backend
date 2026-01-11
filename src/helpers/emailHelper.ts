import nodemailer from 'nodemailer';
import config from '../config';
import { errorLogger, logger } from '../shared/logger';
import { ISendEmail } from '../types/email';
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const ses = new SESv2Client({
    region: config.aws.ses.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId as string,
        secretAccessKey: config.aws.secretAccessKey as string
    }
});

const transporter = nodemailer.createTransport({
    SES: {
        sesClient: ses,
        SendEmailCommand: SendEmailCommand
    }
} as any);

const sendEmail = async (values: ISendEmail) => {
    try {
        const info = await transporter.sendMail({
            from: config.email.from,
            to: values.to,
            subject: values.subject,
            html: values.html,
        });

        logger.info('Mail send successfully', info.messageId);
    } catch (error: any) {
        errorLogger.error('Email', error);
        console.error("Detailed SES Error:", error);
    }
};

export const emailHelper = {
    sendEmail
};