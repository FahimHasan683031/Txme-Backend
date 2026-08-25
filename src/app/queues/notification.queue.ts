import { Queue, Worker, Job } from "bullmq";
import { redisQueueConnection } from "../../config/queue.config";
import { PushNotificationService } from "../modules/notification/pushNotification.service";

export interface INotificationJobData {
    token: string;
    title: string;
    message: string;
    data?: Record<string, any>;
}

export const NOTIFICATION_QUEUE_NAME = "notification-queue";

export const notificationQueue = new Queue<INotificationJobData>(NOTIFICATION_QUEUE_NAME, {
    connection: redisQueueConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

export const notificationWorker = new Worker<INotificationJobData>(
    NOTIFICATION_QUEUE_NAME,
    async (job: Job<INotificationJobData>) => {
        const { token, title, message, data } = job.data;
        console.log(`[NotificationWorker] Processing FCM push for job #${job.id}`);
        await PushNotificationService.sendPushNotification(token, title, message, data);
        console.log(`[NotificationWorker] FCM push sent successfully for job #${job.id}`);
    },
    {
        connection: redisQueueConnection,
    }
);

notificationWorker.on("failed", (job, err) => {
    console.error(`❌ [NotificationWorker] Job #${job?.id} failed: ${err.message}`);
});

export const addNotificationJob = async (notificationData: INotificationJobData) => {
    try {
        await notificationQueue.add("send-fcm-push", notificationData);
    } catch (error: any) {
        console.error("[NotificationQueue] Failed to enqueue FCM push job, fallback inline:", error.message);
        PushNotificationService.sendPushNotification(
            notificationData.token,
            notificationData.title,
            notificationData.message,
            notificationData.data
        ).catch((err) => console.error("[NotificationQueue] Fallback failed:", err));
    }
};
