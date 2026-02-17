"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../config"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const user_1 = require("../../enums/user");
const user_model_1 = require("../modules/user/user.model");
const admin_model_1 = require("../modules/admin/admin.model");
const auth = (...roles) => async (req, res, next) => {
    try {
        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Token not found!");
        }
        if (tokenWithBearer && tokenWithBearer.startsWith("Bearer")) {
            const token = tokenWithBearer.split(" ")[1];
            try {
                // Verify token
                const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwt_secret);
                // Set user to header
                req.user = verifyUser;
                let isExistUser;
                if (verifyUser.role === user_1.ADMIN_ROLES.SUPER_ADMIN || verifyUser.role === user_1.ADMIN_ROLES.ADMIN) {
                    isExistUser = await admin_model_1.Admin.findOne({ _id: verifyUser.id });
                }
                else {
                    isExistUser = await user_model_1.User.findOne({ _id: verifyUser.id });
                }
                // Check if user exists
                if (!isExistUser) {
                    throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
                }
                // Check if user is active
                const onboardingRoutes = [
                    '/api/v1/auth/send-phone-otp',
                    '/api/v1/kyc/didit-session',
                    '/api/v1/auth/complete-profile',
                    '/api/v1/user/me',
                    '/api/v1/user/my-profile'
                ];
                if (isExistUser.status !== 'active') {
                    // Allow 'pending' users for specific onboarding routes
                    // Also allow GET /api/v1/user/:id for profile viewing during onboarding
                    const isUserPath = req.baseUrl + req.path;
                    const isSingleUserGet = isUserPath.startsWith('/api/v1/user/') && req.method === 'GET';
                    const currentPath = (req.baseUrl + req.path).replace(/\/$/, "");
                    const isPendingOnboarding = isExistUser.status === 'pending' &&
                        (onboardingRoutes.includes(currentPath) || isSingleUserGet);
                    if (!isPendingOnboarding) {
                        const statusMessages = {
                            'pending': 'Your account is pending verification. Please complete your profile and verification.',
                            'rejected': 'Your account has been rejected. Please contact support for more information.',
                            'suspended': 'Your account has been suspended. Please contact support.',
                            'blocked': 'Your account has been blocked. Please contact support.',
                            'deleted': 'Your account has been deleted.'
                        };
                        const message = isExistUser.status
                            ? statusMessages[isExistUser.status] || 'Your account is not active.'
                            : 'Your account is not active.';
                        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, message);
                    }
                }
                // Guard user role
                if (roles.length && !roles.includes(verifyUser.role)) {
                    throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
                }
                next();
            }
            catch (error) {
                if (error instanceof Error && error.name === "TokenExpiredError") {
                    throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Access Token has expired");
                }
                next(error);
            }
        }
    }
    catch (error) {
        next(error);
    }
};
exports.default = auth;
