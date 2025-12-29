import { Types } from "mongoose";
import { Review } from "./review.model";
import { User } from "../user/user.model";
import { Appointment } from "../appointment/appointment.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { IReview } from "./review.interface";
import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../../../helpers/QueryBuilder";
import { NotificationService } from "../notification/notification.service";


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
  const { reviewee, appointment: appointmentId } = payload;

  if (user.id.toString() === reviewee.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot review yourself");
  }

  // Check if appointment exists and is paid
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  if (appointment.status !== 'review_pending' && !appointment.status.includes('review_pending')) {
    // If it's already completed, we also block it through already reviewed check
    throw new ApiError(StatusCodes.BAD_REQUEST, "You can only review after payment is completed");
  }

  // Check if reviewer is part of the appointment
  const isCustomer = appointment.customer.toString() === user.id;
  const isProvider = appointment.provider.toString() === user.id;

  if (!isCustomer && !isProvider) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You are not authorized to review this appointment");
  }

  // Check if reviewer has already reviewed this appointment
  const existingReview = await Review.findOne({
    appointment: appointmentId,
    reviewer: user.id
  });

  if (existingReview) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You have already reviewed this appointment");
  }

  payload.reviewer = user.id;

  const review = await Review.create(payload);

  // Update Appointment status based on single-field logic
  let nextStatus = appointment.status;

  if (isCustomer) {
    if (appointment.status === 'review_pending') {
      nextStatus = 'provider_review_pending';
    } else if (appointment.status === 'customer_review_pending') {
      nextStatus = 'completed';
    }
  } else if (isProvider) {
    if (appointment.status === 'review_pending') {
      nextStatus = 'customer_review_pending';
    } else if (appointment.status === 'provider_review_pending') {
      nextStatus = 'completed';
    }
  }

  if (nextStatus !== appointment.status) {
    appointment.status = nextStatus;
    await appointment.save();
  }

  await recalculateUserRating(reviewee);

  // Send Notification to the reviewee
  await NotificationService.insertNotification({
    title: "New Review Received",
    message: `You have received a new ${review.rating}-star review for your service.`,
    receiver: reviewee,
    referenceId: review._id,
    screen: "REVIEW",
    type: "USER",
  });

  return review;
};

// Get my reviews
const getMyReviews = async (user: JwtPayload, query: Record<string, unknown>) => {
  const reviewQeryBuilder = new QueryBuilder(Review.find({ reviewee: user.id }), query)
    .filter()
    .sort()
    .paginate()

  const result = await reviewQeryBuilder.modelQuery.populate("reviewee", "name email profileImage");
  const paginateInfo = await reviewQeryBuilder.getPaginationInfo();
  return { data: result, pagination: paginateInfo };
};

// Get user reviews (all reviews for a specific user)
const getUserReviews = async (userId: string, query: Record<string, unknown>) => {
  const reviewQueryBuilder = new QueryBuilder(
    Review.find({ reviewee: userId })
      .populate("reviewer", "name email profileImage")
      .populate("reviewee", "name email profileImage"),
    query
  )
    .filter()
    .sort()
    .paginate();

  const result = await reviewQueryBuilder.modelQuery;
  const paginateInfo = await reviewQueryBuilder.getPaginationInfo();

  return { data: result, pagination: paginateInfo };
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
  getUserReviews,
  updateReview,
  deleteReview,
};
