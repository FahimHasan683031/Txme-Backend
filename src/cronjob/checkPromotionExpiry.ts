import cron from "node-cron";
import { User } from "../app/modules/user/user.model";

const checkPromotionExpiry = () => {
    // Run every hour
    cron.schedule("0 * * * *", async () => {
        console.log("Running Promotion Expiry Checker...");

        try {
            const now = new Date();

            const result = await User.updateMany(
                {
                    isPromoted: true,
                    promotionExpiry: { $lte: now }
                },
                {
                    $set: {
                        isPromoted: false,
                        // promotionExpiry: null // Optional: keep for history or set null
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`Reset promotion for ${result.modifiedCount} users.`);
            }
        } catch (error) {
            console.error("Error in Promotion Expiry Cron Job:", error);
        }
    });
};

export default checkPromotionExpiry;
