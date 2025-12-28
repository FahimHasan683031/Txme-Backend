"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_status_codes_1 = require("http-status-codes");
const morgan_1 = require("./shared/morgan");
const routes_1 = __importDefault(require("../src/app/routes"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const request_ip_1 = __importDefault(require("request-ip"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ApiErrors_1 = __importDefault(require("./errors/ApiErrors"));
const handleStripeWebhook_1 = __importDefault(require("./stripe/handleStripeWebhook"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        if (!req.clientIp) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Unable to determine client IP!');
        }
        return req.clientIp;
    },
    handler: (req, res, next, options) => {
        throw new ApiErrors_1.default(options === null || options === void 0 ? void 0 : options.statusCode, `Rate limit exceeded. Try again in ${options.windowMs / 60000} minutes.`);
    }
});
// Stripe webhook route
app.use('/webhook', express_1.default.raw({ type: 'application/json' }), handleStripeWebhook_1.default);
// morgan
app.use(morgan_1.Morgan.successHandler);
app.use(morgan_1.Morgan.errorHandler);
//body parser
app.use((0, cors_1.default)({
    origin: ["http://localhost:3001", "http://localhost:3002"],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(request_ip_1.default.mw());
app.use((0, cookie_parser_1.default)());
// app.use(limiter);
//file retrieve
app.use(express_1.default.static('uploads'));
//router
app.use('/api/v1', routes_1.default);
app.get("/", (req, res) => {
    res.send("Hey, Welcome to Save And Date World. How can I assist you ");
});
//global error handle
app.use(globalErrorHandler_1.default);
// handle not found route
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Not Found",
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API DOESN'T EXIST"
            }
        ]
    });
});
exports.default = app;
