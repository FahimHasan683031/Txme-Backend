"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerController = void 0;
const provider_service_1 = require("./provider.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const getProviderCalendar = (0, catchAsync_1.default)(async (req, res) => {
    const calendar = await provider_service_1.proveiderServices.getProviderCalendar(req.params.providerId, req.query.date);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Provider Calendar Retrieve Successfully',
        data: calendar,
    });
});
// get popular providers
const getPopularProviders = (0, catchAsync_1.default)(async (req, res) => {
    const result = await provider_service_1.proveiderServices.getPopularProvidersFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Popular providers retrieved successfully',
        ...result
    });
});
exports.providerController = {
    getProviderCalendar,
    getPopularProviders
};
