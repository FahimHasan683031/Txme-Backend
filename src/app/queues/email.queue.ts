import { Queue, Worker, Job } from "bullmq";
import { redisQueueConnection } from "../../config/queue.config";
import { emailHelper } from "../../helpers/emailHelper";

export interface IEmailJobData {
    to: string;
    subject: string;
    html: string;
}

export const EMAIL_QUEUE_NAME = "email-queue";

export const emailQueue = new Queue<IEmailJobData>(EMAIL_QUEUE_NAME, {
    connection: redisQueueConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

export const emailWorker = new Worker<IEmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<IEmailJobData>) => {
        console.log(`[EmailWorker] Processing job #${job.id} to: ${job.data.to}`);
        await emailHelper.sendEmail(job.data);
        console.log(`[EmailWorker] Successfully sent email to: ${job.data.to}`);
    },
    {
        connection: redisQueueConnection,
    }
);

emailWorker.on("failed", (job, err) => {
    console.error(`❌ [EmailWorker] Job #${job?.id} failed with error: ${err.message}`);
});

export const addEmailJob = async (emailData: IEmailJobData) => {
    try {
        await emailQueue.add("send-email", emailData);
    } catch (error: any) {
        console.error("[EmailQueue] Failed to enqueue email job, sending inline fallback:", error.message);
        emailHelper.sendEmail(emailData).catch((err) => console.error("[EmailQueue] Fallback failed:", err));
    }
};
