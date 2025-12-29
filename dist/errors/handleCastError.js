"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const handleCastError = (error) => {
    const errorMessages = [
        {
            path: error.path,
            message: 'Invalid ID',
        },
    ];
    const statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
    return {
        statusCode,
        message: 'Invalid ID',
        errorMessages,
    };
};
exports.default = handleCastError;
