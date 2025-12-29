import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLES } from "../../../enums/user";
import { ReviewController } from "./review.controller";
import { createReviewZod, updateReviewZod } from "./review.validation";

const router = express.Router();

router.post(
  "/",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  validateRequest(createReviewZod),
  ReviewController.createReview
);

router.get(
  "/my-reviews",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  ReviewController.getMyReviews
);

router.get(
  "/:userId",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  ReviewController.getUserReviews
);

router.patch(
  "/:id",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  validateRequest(updateReviewZod),
  ReviewController.updateReview
);

router.delete(
  "/:id",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  ReviewController.deleteReview
);

export const ReviewRoutes = router;
