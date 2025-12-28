"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_1 = require("../../../enums/user");
const review_controller_1 = require("./review.controller");
const review_validation_1 = require("./review.validation");
const router = express_1.default.Router();
router.post("/", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), (0, validateRequest_1.default)(review_validation_1.createReviewZod), review_controller_1.ReviewController.createReview);
router.get("/my-reviews", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), review_controller_1.ReviewController.getMyReviews);
router.patch("/:id", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), (0, validateRequest_1.default)(review_validation_1.updateReviewZod), review_controller_1.ReviewController.updateReview);
router.delete("/:id", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), review_controller_1.ReviewController.deleteReview);
exports.ReviewRoutes = router;
