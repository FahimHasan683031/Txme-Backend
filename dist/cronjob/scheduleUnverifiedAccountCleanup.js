"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleUnverifiedAccountCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("../shared/logger");
const scheduleUnverifiedAccountCleanup = () => {
    const GRACE_PERIOD_MINUTES = 5;
    node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const cutoffDate = new Date(Date.now() - GRACE_PERIOD_MINUTES * 60 * 1000);
            // Delete unverified accounts older than the grace period
            // const result = await User.deleteMany({
            //     verified: false,
            //     createdAt: { $lt: cutoffDate }, // Only delete accounts created before the cutoff date    
            // });
            // logger.info(`Deleted ${result.deletedCount} unverified accounts.`);    
        }
        catch (error) {
            logger_1.logger.error("Error during unverified account cleanup:", error);
        }
    });
    logger_1.logger.info("Unverified account cleanup job scheduled to run every minute.");
};
exports.scheduleUnverifiedAccountCleanup = scheduleUnverifiedAccountCleanup;
