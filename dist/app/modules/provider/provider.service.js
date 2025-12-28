"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proveiderServices = exports.getPopularProvidersFromDB = exports.getProviderCalendar = void 0;
const user_model_1 = require("../user/user.model");
const generateDailySlots_1 = require("../../../util/generateDailySlots");
const appointment_model_1 = require("../appointment/appointment.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const getProviderCalendar = async (providerId, date) => {
    var _a;
    console.log(providerId, date);
    // Find provider from User model with providerProfile
    const provider = await user_model_1.User.findOne({
        _id: providerId,
        "providerProfile": { $exists: true }
    });
    if (!provider)
        throw new Error("Provider not found");
    if (!provider.providerProfile)
        throw new Error("Provider profile not found");
    const workingHours = provider.providerProfile.workingHours;
    // Check if provider works on the requested day
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (!provider.providerProfile.workingDays.includes(dayOfWeek)) {
        // Provider doesn't work on this day, throw error
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Provider does not work on this day");
    }
    // Check if provider has set this specific date as unavailable
    const isUnavailableDate = (_a = provider.providerProfile.unavailableDates) === null || _a === void 0 ? void 0 : _a.some((d) => d.toISOString().split('T')[0] === requestedDate.toISOString().split('T')[0]);
    if (isUnavailableDate) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Provider is unavailable on this date");
    }
    // generate slots dynamically WITH date
    let slots = (0, generateDailySlots_1.generateDailySlots)(workingHours, date);
    // find booked slots for that date (exclude only cancelled and rejected)
    const appointments = await appointment_model_1.Appointment.find({
        provider: providerId,
        date: requestedDate,
        status: { $nin: ["cancelled", "rejected"] }
    });
    // merge availability
    const finalSlots = slots.map(slot => {
        const isBooked = appointments.some(appointment => {
            // Convert appointment times to comparable format
            const appointmentStart = formatTime(appointment.startTime);
            const appointmentEnd = formatTime(appointment.endTime);
            return appointmentStart === slot.startTime && appointmentEnd === slot.endTime;
        });
        return {
            ...slot,
            status: isBooked ? "booked" : "available"
        };
    });
    return finalSlots;
};
exports.getProviderCalendar = getProviderCalendar;
// Helper function to format time to "HH:MM" format
function formatTime(time) {
    if (time instanceof Date) {
        return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    }
    else if (typeof time === 'string') {
        // If it's already in "HH:MM" format, return as is
        if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            return time;
        }
    }
    // If it's a different format, you may need additional parsing logic
    return time;
}
const getPopularProvidersFromDB = async (query) => {
    // Set default sort by popularity if not specified
    if (!query.sort) {
        query.sort = '-review.averageRating -review.totalReviews';
    }
    const popularQuery = new QueryBuilder_1.default(user_model_1.User.find({ role: "PROVIDER" }), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = await popularQuery.modelQuery;
    const meta = await popularQuery.getPaginationInfo();
    return { data: result, meta };
};
exports.getPopularProvidersFromDB = getPopularProvidersFromDB;
exports.proveiderServices = {
    getProviderCalendar: exports.getProviderCalendar,
    getPopularProvidersFromDB: exports.getPopularProvidersFromDB
};
