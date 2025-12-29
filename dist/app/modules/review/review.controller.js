"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const review_service_1 = require("./review.service");
const http_status_codes_1 = require("http-status-codes");
const createReview = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await review_service_1.ReviewService.createReview(req.body, user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Review submitted successfully",
        data: result,
    });
});
const getMyReviews = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const result = await review_service_1.ReviewService.getMyReviews(user, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Reviews retrieved successfully",
        ...result,
    });
});
const getUserReviews = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.params.userId;
    const result = await review_service_1.ReviewService.getUserReviews(userId, req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User reviews retrieved successfully",
        ...result,
    });
});
const updateReview = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const id = req.params.id;
    const result = await review_service_1.ReviewService.updateReview(id, req.body, user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Review updated successfully",
        data: result,
    });
});
const deleteReview = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const id = req.params.id;
    await review_service_1.ReviewService.deleteReview(id, user);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Review deleted successfully",
        data: null,
    });
});
exports.ReviewController = {
    createReview,
    getMyReviews,
    getUserReviews,
    updateReview,
    deleteReview,
};
