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
const appointment_model_1 = require("../appointment/appointment.model");
const review_model_1 = require("../review/review.model");
const mongoose_1 = require("mongoose");
const geocoding_util_1 = require("../../../util/geocoding.util");
// get all users
const getAllUsers = async (user, query) => {
    if (user.role === "CUSTOMER" || user.role === "PROVIDER") {
        query.role = "PROVIDER";
    }
    // Use query postCode or fallback to user's postalAddress
    let searchPostCode = query.postCode;
    if (!searchPostCode && (user === null || user === void 0 ? void 0 : user.id)) {
        const currentUser = await user_model_1.User.findById(user.id).select("postalAddress");
        if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.postalAddress) {
            searchPostCode = currentUser.postalAddress;
        }
    }
    if (searchPostCode) {
        try {
            const coords = await (0, geocoding_util_1.geocodePostCode)(searchPostCode);
            query.latitude = coords.latitude;
            query.longitude = coords.longitude;
            if (!query.radius) {
                query.radius = 100;
            }
        }
        catch (error) {
            console.error("[UserService] Geocoding in getAllUsers failed:", error);
            throw error;
        }
    }
    else {
        delete query.latitude;
        delete query.longitude;
        delete query.radius;
    }
    const totalUsers = await user_model_1.User.countDocuments({ status: { $ne: "deleted" } });
    // ✅ Force sort by isPromoted first, then Rating, then user preference
    if (query.role === "PROVIDER") {
        const userSort = query.sort || '-createdAt';
        query.sort = `-isPromoted -review.averageRating ${userSort}`;
    }
    const userQueryBuilder = new QueryBuilder_1.default(user_model_1.User.find({ status: { $ne: "deleted" } })
        .select("fullName email profilePicture status review  role createdAt"), query)
        .geolocation()
        .providerFilter()
        .filter()
        .search(["fullName", "email", "phone", "providerProfile.serviceCategory", "providerProfile.skills"])
        .sort()
        .paginate();
    const users = await userQueryBuilder.modelQuery;
    const paginateInfo = await userQueryBuilder.getPaginationInfo();
    return { data: users, pagination: { ...paginateInfo, totalData: totalUsers } };
};
const updateProfileToDB = async (user, payload) => {
    const { id } = user;
    const isExistUser = await user_model_1.User.findById(id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // ✅ Fix for profilePicture field name
    if (payload.profilePicture && isExistUser.profilePicture) {
        (0, unlinkFile_1.default)(isExistUser.profilePicture);
    }
    // Update fields
    if (payload.providerProfile) {
        if (!isExistUser.providerProfile) {
            // If profile doesn't exist, create it with payload
            isExistUser.providerProfile = payload.providerProfile;
        }
        else {
            // We iterate keys to ensure we update the subdocument properties
            for (const [key, value] of Object.entries(payload.providerProfile)) {
                // @ts-ignore
                isExistUser.providerProfile[key] = value;
            }
        }
        delete payload.providerProfile;
    }
    // Use Mongoose set for remaining top-level fields
    if (Object.keys(payload).length > 0) {
        isExistUser.set(payload);
    }
    // Save triggers the pre-save hook for validation
    const updatedUser = await isExistUser.save();
    return updatedUser;
};
const getSingleUser = async (id) => {
    const user = await user_model_1.User.findById(id).select("-authentication");
    if (!user)
        return null;
    const stats = await getUserStats(user);
    return {
        ...user.toObject(),
        ...stats
    };
};
const getmyProfile = async (user) => {
    const { id } = user;
    const result = await user_model_1.User.findById(id).select("-authentication");
    if (!result)
        return null;
    const stats = await getUserStats(result);
    return {
        ...result.toObject(),
        ...stats
    };
};
/**
 * Helper to calculate user statistics
 */
async function getUserStats(user) {
    const userId = user._id;
    const role = user.role;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const paidStatuses = ["review_pending", "provider_review_pending", "customer_review_pending", "completed"];
    if (role === "PROVIDER") {
        // 1. Total Appointments
        const totalAppointments = await appointment_model_1.Appointment.countDocuments({ provider: userId });
        // 2. Total Appointments This Month
        const totalAppointmentsThisMonth = await appointment_model_1.Appointment.countDocuments({
            provider: userId,
            createdAt: { $gte: startOfMonth }
        });
        // 3. Total Earning
        const earningResult = await appointment_model_1.Appointment.aggregate([
            { $match: { provider: new mongoose_1.Types.ObjectId(userId), status: { $in: paidStatuses } } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);
        const totalEarning = earningResult.length > 0 ? earningResult[0].total : 0;
        // 4. Total Earn This Month
        const monthlyEarningResult = await appointment_model_1.Appointment.aggregate([
            {
                $match: {
                    provider: new mongoose_1.Types.ObjectId(userId),
                    status: { $in: paidStatuses },
                    createdAt: { $gte: startOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);
        const totalEarnThisMonth = monthlyEarningResult.length > 0 ? monthlyEarningResult[0].total : 0;
        // 5. Last 10 Reviews
        const last10Reviews = await review_model_1.Review.find({ reviewee: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("reviewer", "fullName profilePicture");
        return {
            totalAppointments,
            totalAppointmentsThisMonth,
            totalEarning,
            totalEarnThisMonth,
            last10Reviews
        };
    }
    else if (role === "CUSTOMER") {
        // 1. Total Appointments Booked
        const totalAppointmentsBooked = await appointment_model_1.Appointment.countDocuments({ customer: userId });
        // 2. Total Appointment This Month
        const totalAppointmentsThisMonth = await appointment_model_1.Appointment.countDocuments({
            customer: userId,
            createdAt: { $gte: startOfMonth }
        });
        // 3. Total Spend
        const spendResult = await appointment_model_1.Appointment.aggregate([
            { $match: { customer: new mongoose_1.Types.ObjectId(userId), status: { $in: paidStatuses } } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);
        const totalSpend = spendResult.length > 0 ? spendResult[0].total : 0;
        // 4. Total Spend This Month
        const monthlySpendResult = await appointment_model_1.Appointment.aggregate([
            {
                $match: {
                    customer: new mongoose_1.Types.ObjectId(userId),
                    status: { $in: paidStatuses },
                    createdAt: { $gte: startOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);
        const totalSpendThisMonth = monthlySpendResult.length > 0 ? monthlySpendResult[0].total : 0;
        // 5. Last 10 Reviews
        const last10Reviews = await review_model_1.Review.find({ reviewee: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("reviewer", "fullName profilePicture");
        return {
            totalAppointmentsBooked,
            totalAppointmentsThisMonth,
            totalSpend,
            totalSpendThisMonth,
            last10Reviews
        };
    }
    return {};
}
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
