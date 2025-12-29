"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const support_model_1 = require("./support.model");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const makeSupportInDB = async (payload) => {
    const support = await support_model_1.Support.create(payload);
    if (!support) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to Submit");
    }
    return support;
};
const supportsFromDB = async (query) => {
    const support = new QueryBuilder_1.default(support_model_1.Support.find(), query).paginate();
    const supports = await support.modelQuery;
    const pagination = await support.getPaginationInfo();
    return { data: supports, meta: pagination };
};
exports.SupportService = {
    makeSupportInDB,
    supportsFromDB
};
