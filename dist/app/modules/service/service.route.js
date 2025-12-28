"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRoutes = void 0;
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const service_controller_1 = require("./service.controller");
const express_1 = __importDefault(require("express"));
const service_validation_1 = require("./service.validation");
const processReqBody_1 = require("../../middlewares/processReqBody");
const router = express_1.default.Router();
router.post("/create-service", (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(service_validation_1.createServiceZod), service_controller_1.serviceController.createService);
router.get("/get-services", service_controller_1.serviceController.getAllServices);
router.get("/get-all-child-services", service_controller_1.serviceController.getAllChildServices);
router.put("/update-service/:id", service_controller_1.serviceController.updateService);
router.delete("/delete-service/:id", service_controller_1.serviceController.deleteService);
exports.ServiceRoutes = router;
