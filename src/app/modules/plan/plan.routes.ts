import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { PlanController } from "./plan.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createPlanZodValidationSchema } from "./plan.validation";
const router = express.Router()

router.route("/")
    .post(
        auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
        validateRequest(createPlanZodValidationSchema),
        PlanController.createPlan
    )
    .get(
        auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.VENDOR),
        PlanController.getPlan
    )

router
    .route("/:id")
    .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), PlanController.updatePlan)
    .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), PlanController.deletePlan)

export const PlanRoutes = router;