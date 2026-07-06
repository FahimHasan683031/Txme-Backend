"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const resetToken_model_1 = require("../resetToken/resetToken.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const admin_model_1 = require("./admin.model");
const user_model_1 = require("../user/user.model");
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const cryptoToken_1 = __importDefault(require("../../../util/cryptoToken"));
const user_1 = require("../../../enums/user");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const appointment_model_1 = require("../appointment/appointment.model");
const service_model_1 = require("../service/service.model");
// create admin
const createAdminToDB = async (payload) => {
    const user = await admin_model_1.Admin.create(payload);
    return user;
};
// Get all admins
const getAllAdminsFromDB = async (query) => {
    const totalAdmins = await admin_model_1.Admin.countDocuments({ status: { $ne: "deleted" } });
    const totalInactiveAdmins = await admin_model_1.Admin.countDocuments({ status: "inactive" });
    const totalActiveAdmins = await admin_model_1.Admin.countDocuments({ status: "active" });
    const adninQuery = new QueryBuilder_1.default(admin_model_1.Admin.find({ status: { $ne: "deleted" } }), query)
        .filter()
        .sort()
        .paginate();
    const admins = await adninQuery.modelQuery;
    const meta = await adninQuery.getPaginationInfo();
    return { admins, meta, totalAdmins, totalInactiveAdmins, totalActiveAdmins };
};
//login
const loginAdminFromDB = async (payload) => {
    const { email, password } = payload;
    const isExistUser = await admin_model_1.Admin.findOne({ email }).select('+password');
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid credentials");
    }
    //check verified and status
    if (!isExistUser.verified) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please verify your account, then try to login again');
    }
    //check user status
    if (isExistUser.status === 'delete') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content.It looks like your account has been deactivated.');
    }
    if (isExistUser.status === "inactive") {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Your account is inactive. Please contact support to activate it.');
    }
    if (isExistUser.role !== user_1.ADMIN_ROLES.SUPER_ADMIN && isExistUser.role !== user_1.ADMIN_ROLES.ADMIN) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content.');
    }
    //check match password
    if (password &&
        !(await admin_model_1.Admin.isMatchPassword(password, isExistUser.password))) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid credentials');
    }
    //create token
    const createToken = jwtHelper_1.jwtHelper.createToken({
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        name: isExistUser.name,
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    const refreshToken = jwtHelper_1.jwtHelper.createToken({
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        name: isExistUser.name,
    }, config_1.default.jwt.jwtRefreshSecret, config_1.default.jwt.jwtRefreshExpiresIn);
    const userInfo = {
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        name: isExistUser.name,
    };
    return { createToken, refreshToken, userInfo };
};
//forget password
const forgetPasswordToDB = async (email) => {
    const isExistUser = await admin_model_1.Admin.isExistUserByEmail(email);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //send mail
    const otp = (0, generateOTP_1.default)();
    const value = {
        name: isExistUser.name,
        otp: otp,
        email: isExistUser.email,
    };
    setTimeout(() => {
        const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
        emailHelper_1.emailHelper.sendEmail(forgetPassword);
    }, 0);
    //save to DB
    const authentication = {
        isResetPassword: true,
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 3 * 60000),
    };
    await admin_model_1.Admin.findOneAndUpdate({ email }, { $set: { authentication } });
};
//verify email
const verifyEmailToDB = async (payload) => {
    var _a, _b;
    const { email, oneTimeCode } = payload;
    const isExistUser = await admin_model_1.Admin.findOne({ email }).select('+authentication');
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    if (!oneTimeCode) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give the otp, check your email we send a code');
    }
    if (((_a = isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.oneTimeCode) !== oneTimeCode) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You provided wrong otp');
    }
    const date = new Date();
    const expireAtDate = ((_b = isExistUser.authentication) === null || _b === void 0 ? void 0 : _b.expireAt)
        ? new Date(isExistUser.authentication.expireAt.toString())
        : null;
    if (expireAtDate && date > expireAtDate) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Otp already expired, Please try again');
    }
    let message;
    let data;
    if (!isExistUser.verified) {
        await admin_model_1.Admin.findOneAndUpdate({ _id: isExistUser._id }, { verified: true, authentication: { oneTimeCode: null, expireAt: null } });
        message = 'Email verify successfully';
    }
    else {
        await admin_model_1.Admin.findOneAndUpdate({ _id: isExistUser._id }, {
            authentication: {
                isResetPassword: true,
                oneTimeCode: null,
                expireAt: null,
            },
        });
        //create token ;
        const createToken = (0, cryptoToken_1.default)();
        await resetToken_model_1.ResetToken.create({
            user: isExistUser._id,
            token: createToken,
            expireAt: new Date(Date.now() + 5 * 60000),
        });
        message =
            'Verification Successful: Please securely store and utilize this code for reset password';
        data = createToken;
    }
    return { message, data };
};
//reset password
const resetPasswordToDB = async (token, payload) => {
    var _a;
    const { newPassword, confirmPassword } = payload;
    //isExist token
    const isExistToken = await resetToken_model_1.ResetToken.isExistToken(token);
    if (!isExistToken) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }
    //user permission check
    const isExistUser = await admin_model_1.Admin.findById(isExistToken.user).select('+authentication');
    if (!((_a = isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.isResetPassword)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You don't have permission to change the password. Please click again to 'Forgot Password'");
    }
    //validity check
    const isValid = await resetToken_model_1.ResetToken.isExpireToken(token);
    if (!isValid) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token expired, Please click again to the forget password');
    }
    //check password
    if (newPassword !== confirmPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const hashPassword = await bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = {
        password: hashPassword,
        authentication: {
            isResetPassword: false,
        },
    };
    await admin_model_1.Admin.findOneAndUpdate({ _id: isExistToken.user }, updateData, {
        new: true,
    });
};
const changePasswordToDB = async (user, payload) => {
    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = await admin_model_1.Admin.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //current password match
    if (currentPassword &&
        !(await admin_model_1.Admin.isMatchPassword(currentPassword, isExistUser.password))) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }
    //new password and confirm password check
    if (newPassword !== confirmPassword) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }
    //hash password
    const hashPassword = await bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = {
        password: hashPassword,
    };
    await admin_model_1.Admin.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
};
// toggle user status (active/blocked)
const toggleUserStatusInDB = async (userId) => {
    const user = await admin_model_1.Admin.findById(userId);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    if (user.role === user_1.ADMIN_ROLES.SUPER_ADMIN) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You can't toggle super admin");
    }
    // Toggle between active and blocked
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const updatedUser = await admin_model_1.Admin.findByIdAndUpdate(userId, { status: newStatus }, { new: true }).select('-authentication');
    return updatedUser;
};
// delete user (soft delete)
const deleteUserFromDB = async (userId) => {
    const user = await admin_model_1.Admin.findById(userId);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    if (user.role === user_1.ADMIN_ROLES.SUPER_ADMIN) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You can't delete super admin");
    }
    await admin_model_1.Admin.findByIdAndUpdate(userId, { status: 'deleted' }, { new: true });
    return { message: 'User deleted successfully' };
};
// get dashboard overview
const getDashboardOverviewFromDB = async (year) => {
    const currentYear = year || new Date().getFullYear();
    // 1. Total Counts
    const totalCompletedJobs = await appointment_model_1.Appointment.countDocuments({ status: 'completed' });
    const totalUsers = await user_model_1.User.countDocuments({ status: { $ne: 'deleted' } });
    const totalServices = await service_model_1.ServiceModel.countDocuments({ isActive: true, parent: { $ne: null } });
    // 2. Total Amount from completed jobs
    const totalAmountResult = await appointment_model_1.Appointment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;
    // 3. Monthly Providers Overview
    const monthlyProviders = await user_model_1.User.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
                },
                status: { $ne: 'deleted' },
                role: user_1.USER_ROLES.PROVIDER
            }
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
    // 4. Monthly Customers Overview
    const monthlyCustomers = await user_model_1.User.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
                },
                status: { $ne: 'deleted' },
                role: user_1.USER_ROLES.CUSTOMER
            }
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
    // 5. Monthly Completed Jobs Overview
    const monthlyJobs = await appointment_model_1.Appointment.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
                },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
    // Format charts to include all 12 months
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const userOverview = months.map((month, index) => {
        const providerFound = monthlyProviders.find(item => item._id === index + 1);
        const customerFound = monthlyCustomers.find(item => item._id === index + 1);
        return {
            month,
            provider: providerFound ? providerFound.count : 0,
            customer: customerFound ? customerFound.count : 0
        };
    });
    const jobOverview = months.map((month, index) => {
        const found = monthlyJobs.find(item => item._id === index + 1);
        return {
            month,
            count: found ? found.count : 0
        };
    });
    return {
        totalCompletedJobs,
        totalUsers,
        totalServices,
        totalAmount,
        userOverview,
        jobOverview
    };
};
exports.AdminService = {
    verifyEmailToDB,
    loginAdminFromDB,
    forgetPasswordToDB,
    resetPasswordToDB,
    changePasswordToDB,
    createAdminToDB,
    toggleUserStatusInDB,
    deleteUserFromDB,
    getAllAdminsFromDB,
    getDashboardOverviewFromDB
};
