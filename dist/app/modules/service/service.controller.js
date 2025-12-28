"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceController = void 0;
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const service_service_1 = require("./service.service");
const http_status_codes_1 = require("http-status-codes");
// create service
const createService = async (req, res) => {
    const payload = req.body;
    const result = await service_service_1.serviceService.createService(payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Service created successfully",
        data: result,
    });
};
// get all services
const getAllServices = async (req, res) => {
    const result = await service_service_1.serviceService.getAllServices(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Services retrieved successfully",
        data: result,
    });
};
// update service
const updateService = async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await service_service_1.serviceService.updateService(id, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Service updated successfully",
        data: result,
    });
};
// delete service
const deleteService = async (req, res) => {
    const id = req.params.id;
    const result = await service_service_1.serviceService.deleteService(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Service deleted successfully",
        data: result,
    });
};
// get all child services
const getAllChildServices = async (req, res) => {
    const result = await service_service_1.serviceService.getAllChildServices();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Child services retrieved successfully",
        data: result,
    });
};
exports.serviceController = {
    createService,
    getAllServices,
    updateService,
    deleteService,
    getAllChildServices,
};
