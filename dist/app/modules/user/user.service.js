"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = require("./user.model");
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
// get all users
const getAllUsers = async (user, query) => {
    if (user.role === "CUSTOMER" || user.role === "PROVIDER") {
        query.role = "PROVIDER";
    }
    const userQueryBuilder = new QueryBuilder_1.default(user_model_1.User.find(), query)
        .geolocation()
        .providerFilter()
        .filter()
        .search(["fullName", "email", "phone", "providerProfile.serviceCategory", "providerProfile.skills"])
        .sort()
        .paginate();
    const users = await userQueryBuilder.modelQuery;
    const paginateInfo = await userQueryBuilder.getPaginationInfo();
    return { data: users, meta: paginateInfo };
};
const updateProfileToDB = async (user, payload) => {
    var _a;
    const { id } = user;
    const isExistUser = await user_model_1.User.findById(id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // ✅ Fix for profilePicture field name
    if (payload.profilePicture && isExistUser.profilePicture) {
        (0, unlinkFile_1.default)(isExistUser.profilePicture);
    }
    if ((_a = payload.providerProfile) === null || _a === void 0 ? void 0 : _a.workingHours) {
        const workingHours = payload.providerProfile.workingHours;
        if (!workingHours.startTime || !workingHours.endTime || !workingHours.duration) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Working hours is required!");
        }
        const [startH, startM] = workingHours.startTime.split(":").map(Number);
        const [endH, endM] = workingHours.endTime.split(":").map(Number);
        const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
        const slotDurationMinutes = workingHours.duration * 60;
        if (totalMinutes <= 0) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "End time must be after start time");
        }
        if (totalMinutes % slotDurationMinutes !== 0) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `The slot duration (${workingHours.duration} hours) does not fit perfectly into the working hours (${workingHours.startTime} - ${workingHours.endTime}).`);
        }
    }
    const updatedUser = await user_model_1.User.findByIdAndUpdate(id, payload, {
        new: true,
    });
    return updatedUser;
};
const getSingleUser = async (id) => {
    const user = await user_model_1.User.findById(id);
    return user;
};
const getmyProfile = async (user) => {
    const { id } = user;
    const result = await user_model_1.User.findById(id);
    return result;
};
// update user status
const updateUserStatusInDB = async (userId, status) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    const validStatuses = ['pending', 'active', 'rejected', 'suspended', 'blocked', 'deleted'];
    if (!validStatuses.includes(status)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`);
    }
    const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { status }, { new: true }).select('-authentication');
    return updatedUser;
};
// delete user (soft delete)
const deleteUserFromDB = async (userId) => {
    const user = await user_model_1.User.findById(userId);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User doesn't exist!");
    }
    if (user.status === 'deleted') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is already deleted');
    }
    await user_model_1.User.findByIdAndUpdate(userId, { status: 'deleted' }, { new: true });
    return { message: 'User deleted successfully' };
};
const updateFcmTokenToDB = async (user, token) => {
    const { id } = user;
    const result = await user_model_1.User.findByIdAndUpdate(id, { fcmToken: token }, { new: true });
    return result;
};
exports.UserService = {
    getAllUsers,
    updateProfileToDB,
    getSingleUser,
    getmyProfile,
    updateUserStatusInDB,
    deleteUserFromDB,
    updateFcmTokenToDB
};
