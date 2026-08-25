import { Queue, Worker, Job } from "bullmq";
import { redisQueueConnection } from "../../config/queue.config";
import { scheduleUnverifiedAccountCleanup } from "../../cronjob/scheduleUnverifiedAccountCleanup";
import checkPromotionExpiry from "../../cronjob/checkPromotionExpiry";

export const CRON_QUEUE_NAME = "cron-queue";

export const cronQueue = new Queue(CRON_QUEUE_NAME, {
    connection: redisQueueConnection,
    defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
    },
});

export const cronWorker = new Worker(
    CRON_QUEUE_NAME,
    async (job: Job) => {
        console.log(`[CronWorker] Executing scheduled background task: ${job.name}`);
        if (job.name === "cleanup-unverified-accounts") {
            await scheduleUnverifiedAccountCleanup();
        } else if (job.name === "check-promotion-expiry") {
            await checkPromotionExpiry();
        }
    },
    {
        connection: redisQueueConnection,
    }
);

cronWorker.on("failed", (job, err) => {
    console.error(`❌ [CronWorker] Scheduled task #${job?.name} failed: ${err.message}`);
});

export const initRepeatableCronJobs = async () => {
    try {
        // Daily unverified account cleanup at midnight
        await (cronQueue as any).add("cleanup-unverified-accounts", {}, {
            repeat: { pattern: "0 0 * * *" }
        });

        // Hourly promotion expiry check
        await (cronQueue as any).add("check-promotion-expiry", {}, {
            repeat: { pattern: "0 * * * *" }
        });

        console.log("🚀 [CronQueue] Successfully initialized repeatable BullMQ cron jobs");
    } catch (error: any) {
        console.warn(`⚠️ [CronQueue] Repeatable cron init warning: ${error.message}`);
    }
};
