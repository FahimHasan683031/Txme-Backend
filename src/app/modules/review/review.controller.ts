import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ReviewService } from "./review.service";
import { StatusCodes } from "http-status-codes";

const createReview = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user;
    const result = await ReviewService.createReview(
      req.body,
      user
    );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Review submitted successfully",
      data: result,
    });
  }
);



const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ReviewService.getMyReviews(user, req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Reviews retrieved successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;
  const result = await ReviewService.updateReview(id, req.body, user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const id = req.params.id;
  await ReviewService.deleteReview(id, user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Review deleted successfully",
    data: null,
  });
});

export const ReviewController = {
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
};
