import cron from "node-cron";
import { User } from "../app/modules/user/user.model";
import { logger } from "../shared/logger";

export const scheduleUnverifiedAccountCleanup = () => {
    // Grace period: 1 Hour
    const GRACE_PERIOD_MS = 60 * 60 * 1000;

    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
        try {
            const cutoffDate = new Date(Date.now() - GRACE_PERIOD_MS);

            // Delete pending accounts older than 1 hour
            const result = await User.deleteMany({
                status: 'pending',
                createdAt: { $lt: cutoffDate },
            });

            if (result.deletedCount > 0) {
                logger.info(`[Cleanup Job] Deleted ${result.deletedCount} pending accounts older than 1 hour.`);
            }
        } catch (error) {
            logger.error("Error during pending account cleanup:", error);
        }
    });

    logger.info("Pending account cleanup job scheduled (Runs every 5 minutes).");
};