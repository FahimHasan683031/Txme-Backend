import { IReview } from "./review.interface";
import { Review } from "./review.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { Package } from "../package/package.model";

const createReviewToDB = async (payload: IReview): Promise<IReview> => {

    const isExistPackage = await Package.findById(payload.package);
    if (!isExistPackage) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Package Not Found");
    }
    payload.vendor = isExistPackage.vendor;

    const result = await Review.create(payload);
    if (!result) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed To create Review")
    }
    return result;
};


export const ReviewService = { createReviewToDB }