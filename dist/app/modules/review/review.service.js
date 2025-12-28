"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const mongoose_1 = require("mongoose");
const review_model_1 = require("./review.model");
const user_model_1 = require("../user/user.model");
const appointment_model_1 = require("../appointment/appointment.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const notification_service_1 = require("../notification/notification.service");
const recalculateUserRating = async (userId) => {
    const stats = await review_model_1.Review.aggregate([
        { $match: { reviewee: new mongoose_1.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$reviewee",
                totalReviews: { $sum: 1 },
                averageRating: { $avg: "$rating" },
            },
        },
    ]);
    const data = stats[0] || { totalReviews: 0, averageRating: 0 };
    await user_model_1.User.findByIdAndUpdate(userId, {
        $set: {
            "review.averageRating": Number(data.averageRating.toFixed(2)),
            "review.totalReviews": data.totalReviews,
        },
    });
};
// Create review
const createReview = async (payload, user) => {
    const { reviewee, appointment: appointmentId } = payload;
    if (user.id.toString() === reviewee.toString()) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You cannot review yourself");
    }
    // Check if appointment exists and is paid
    const appointment = await appointment_model_1.Appointment.findById(appointmentId);
    if (!appointment) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    if (appointment.status !== 'review_pending' && !appointment.status.includes('review_pending')) {
        // If it's already completed, we also block it through already reviewed check
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You can only review after payment is completed");
    }
    // Check if reviewer is part of the appointment
    const isCustomer = appointment.customer.toString() === user.id;
    const isProvider = appointment.provider.toString() === user.id;
    if (!isCustomer && !isProvider) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to review this appointment");
    }
    // Check if reviewer has already reviewed this appointment
    const existingReview = await review_model_1.Review.findOne({
        appointment: appointmentId,
        reviewer: user.id
    });
    if (existingReview) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You have already reviewed this appointment");
    }
    payload.reviewer = user.id;
    const review = await review_model_1.Review.create(payload);
    // Update Appointment status based on single-field logic
    let nextStatus = appointment.status;
    if (isCustomer) {
        if (appointment.status === 'review_pending') {
            nextStatus = 'provider_review_pending';
        }
        else if (appointment.status === 'customer_review_pending') {
            nextStatus = 'completed';
        }
    }
    else if (isProvider) {
        if (appointment.status === 'review_pending') {
            nextStatus = 'customer_review_pending';
        }
        else if (appointment.status === 'provider_review_pending') {
            nextStatus = 'completed';
        }
    }
    if (nextStatus !== appointment.status) {
        appointment.status = nextStatus;
        await appointment.save();
    }
    await recalculateUserRating(reviewee);
    // Send Notification to the reviewee
    await notification_service_1.NotificationService.insertNotification({
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
const getMyReviews = async (user, query) => {
    const reviewQeryBuilder = new QueryBuilder_1.default(review_model_1.Review.find({ reviewee: user.id }), query)
        .filter()
        .sort()
        .paginate();
    const result = await reviewQeryBuilder.modelQuery.populate("reviewee", "name email profileImage");
    const paginateInfo = reviewQeryBuilder.getPaginationInfo();
    return { data: result, meta: paginateInfo };
};
// Update review
const updateReview = async (id, payload, user) => {
    const review = await review_model_1.Review.findById(id);
    if (!review) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Review not found");
    }
    if (review.reviewer.toString() !== user.id) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not allowed to update this review");
    }
    const updatedReview = await review_model_1.Review.findByIdAndUpdate(id, payload, {
        new: true,
    });
    if (updatedReview) {
        await recalculateUserRating(updatedReview.reviewee);
    }
    return updatedReview;
};
// Delete review
const deleteReview = async (id, user) => {
    const review = await review_model_1.Review.findById(id);
    if (!review) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Review not found");
    }
    if (review.reviewer.toString() !== user.id) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not allowed to delete this review");
    }
    await review_model_1.Review.findByIdAndDelete(id);
    await recalculateUserRating(review.reviewee);
    return review;
};
exports.ReviewService = {
    createReview,
    getMyReviews,
    updateReview,
    deleteReview,
};
