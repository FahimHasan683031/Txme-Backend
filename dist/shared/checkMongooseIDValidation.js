"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMongooseIDValidation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const checkMongooseIDValidation = (id, name) => {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid ${name} Object ID`);
    }
    return;
};
exports.checkMongooseIDValidation = checkMongooseIDValidation;
