import { Types } from "mongoose";
import { Review } from "./review.model";
import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { IReview } from "./review.interface";
import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../../../helpers/QueryBuilder";


const recalculateUserRating = async (userId: Types.ObjectId) => {
  const stats = await Review.aggregate([
    { $match: { reviewee: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: "$reviewee",
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  const data = stats[0] || { totalReviews: 0, averageRating: 0 };

  await User.findByIdAndUpdate(userId, {
    $set: {
      "review.averageRating": Number(data.averageRating.toFixed(2)),
      "review.totalReviews": data.totalReviews,
    },
  });
};

// Create review
const createReview = async (payload: IReview, user: JwtPayload) => {
  const { reviewee } = payload;

  if (user.id.toString() === reviewee.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot review yourself");
  }

  payload.reviewer = user.id;

  const review = await Review.create(payload);

  await recalculateUserRating(reviewee);

  return review;
};

// Get my reviews
const getMyReviews = async (user: JwtPayload, query: Record<string, unknown>) => {
  const reviewQeryBuilder = new QueryBuilder(Review.find({ reviewee: user.id }), query)
    .filter()
    .sort()
    .paginate()

  const result = await reviewQeryBuilder.modelQuery.populate("reviewee", "name email profileImage").populate("service", "title");
  const paginateInfo = reviewQeryBuilder.getPaginationInfo();
  return { data: result, meta: paginateInfo };
};


// Update review
const updateReview = async (
  id: string,
  payload: Partial<IReview>,
  user: JwtPayload
) => {
  const review = await Review.findById(id);

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  if (review.reviewer.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not allowed to update this review"
    );
  }

  const updatedReview = await Review.findByIdAndUpdate(id, payload, {
    new: true,
  });

  if (updatedReview) {
    await recalculateUserRating(updatedReview.reviewee);
  }

  return updatedReview;
};


// Delete review
const deleteReview = async (id: string, user: JwtPayload) => {
  const review = await Review.findById(id);

  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Review not found");
  }

  if (review.reviewer.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not allowed to delete this review"
    );
  }

  await Review.findByIdAndDelete(id);

  await recalculateUserRating(review.reviewee);

  return review;
};

export const ReviewService = {
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
};
