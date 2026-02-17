"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleUnverifiedAccountCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const user_model_1 = require("../app/modules/user/user.model");
const logger_1 = require("../shared/logger");
const scheduleUnverifiedAccountCleanup = () => {
    // Grace period: 1 Hour
    const GRACE_PERIOD_MS = 60 * 60 * 1000;
    // Run every 5 minutes
    node_cron_1.default.schedule("*/5 * * * *", async () => {
        try {
            const cutoffDate = new Date(Date.now() - GRACE_PERIOD_MS);
            // Delete pending accounts older than 1 hour
            const result = await user_model_1.User.deleteMany({
                status: 'pending',
                createdAt: { $lt: cutoffDate },
            });
            if (result.deletedCount > 0) {
                logger_1.logger.info(`[Cleanup Job] Deleted ${result.deletedCount} pending accounts older than 1 hour.`);
            }
        }
        catch (error) {
            logger_1.logger.error("Error during pending account cleanup:", error);
        }
    });
    logger_1.logger.info("Pending account cleanup job scheduled (Runs every 5 minutes).");
};
exports.scheduleUnverifiedAccountCleanup = scheduleUnverifiedAccountCleanup;
