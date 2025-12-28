"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const review_model_1 = require("../app/modules/review/review.model");
const calculateAverageRating = async (packageId) => {
    const result = await review_model_1.Review.aggregate([
        {
            $match: {
                package: new mongoose_1.Types.ObjectId(packageId),
                rating: { $exists: true, $ne: null }
            }
        },
        {
            $group: {
                _id: "$package",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    if (result.length === 0) {
        return 0;
    }
    return result[0].averageRating;
};
exports.default = calculateAverageRating;
