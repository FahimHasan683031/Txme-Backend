import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { SubscriptionController } from "./subscription.controller";
const router = express.Router();

router.get("/", 
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), 
    SubscriptionController.subscriptions
);

router.get("/my-plan", 
    auth(USER_ROLES.VENDOR), 
    SubscriptionController.subscriptionDetails
);

export const SubscriptionRoutes = router;