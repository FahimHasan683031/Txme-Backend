import validateRequest from "../../middlewares/validateRequest";
import { serviceController } from "./service.controller";
import express from "express";
import { createServiceZod } from "./service.validation";
import { fileAndBodyProcessorUsingDiskStorage } from "../../middlewares/processReqBody";

const router = express.Router();

router.post("/create-service",
    fileAndBodyProcessorUsingDiskStorage(),
    validateRequest(createServiceZod),
    serviceController.createService);
router.get("/get-services", serviceController.getAllServices);
router.get("/get-all-child-services", serviceController.getAllChildServices);
router.put("/update-service/:id", serviceController.updateService);
router.delete("/delete-service/:id", serviceController.deleteService);


export const ServiceRoutes = router;