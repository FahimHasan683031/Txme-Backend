import { Types } from "mongoose";
import { Review } from "../app/modules/review/review.model";

const calculateAverageRating = async (packageId: string): Promise<number> => {


    const result = await Review.aggregate([
        {
            $match: {
                package: new Types.ObjectId(packageId),
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

export default calculateAverageRating;
