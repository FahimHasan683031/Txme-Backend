import validateRequest from "../../middlewares/validateRequest";
import { serviceController } from "./service.controller";
import express from "express";
import { createServiceZod, updateServiceZod } from "./service.validation";
import { fileAndBodyProcessorUsingDiskStorage } from "../../middlewares/processReqBody";
import auth from "../../middlewares/auth";
import { ADMIN_ROLES } from "../../../enums/user";

const router = express.Router();

router.post("/create-service",
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(createServiceZod),
    auth(ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN),
    serviceController.createService);
router.get("/get-services", serviceController.getAllServices);
router.get("/get-all-child-services", serviceController.getAllChildServices);
router.put("/update-service/:id",
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(updateServiceZod),
    auth(ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN),
    serviceController.updateService);
router.delete("/delete-service/:id",
    auth(ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN),
    serviceController.deleteService);


export const ServiceRoutes = router;