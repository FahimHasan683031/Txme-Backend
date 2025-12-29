"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = exports.getAppointmentById = exports.updateAppointmentStatus = exports.createAppointment = void 0;
const user_1 = require("../../../enums/user");
const appointment_model_1 = require("./appointment.model");
const user_model_1 = require("../user/user.model");
const generateDailySlots_1 = require("../../../util/generateDailySlots");
const checkSetting_1 = require("../../../helpers/checkSetting");
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const wallet_service_1 = require("../wallet/wallet.service");
const notification_service_1 = require("../notification/notification.service");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const createAppointment = async (customerId, data) => {
    var _a;
    const { provider, date, startTime, endTime, service, paymentMethod } = data;
    // Validate provider exists and has provider profile
    const providerUser = await user_model_1.User.findOne({
        _id: provider,
        "providerProfile": { $exists: true }
    });
    if (!(providerUser === null || providerUser === void 0 ? void 0 : providerUser.providerProfile)) {
        throw new Error("Provider profile not found");
    }
    // Check if provider is available on the requested date
    const requestedDate = new Date(date);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = days[requestedDate.getUTCDay()];
    if (!providerUser.providerProfile.workingDays.includes(dayOfWeek)) {
        throw new Error("Provider not available on this day");
    }
    // Check if provider has set this specific date as unavailable
    const isUnavailableDate = (_a = providerUser.providerProfile.unavailableDates) === null || _a === void 0 ? void 0 : _a.some((d) => d.toISOString().split('T')[0] === requestedDate.toISOString().split('T')[0]);
    if (isUnavailableDate) {
        throw new Error("Provider is unavailable on this date");
    }
    // Generate valid slots for the provider
    const validSlots = (0, generateDailySlots_1.generateDailySlots)(providerUser.providerProfile.workingHours, date);
    // Validate the requested slot
    const isValidSlot = validSlots.some(slot => slot.startTime === startTime && slot.endTime === endTime);
    if (!isValidSlot) {
        throw new Error("Invalid time slot");
    }
    // Check for existing Appointments in the same time slot
    const conflictingAppointment = await appointment_model_1.Appointment.findOne({
        provider,
        date: requestedDate,
        startTime,
        endTime,
        status: { $in: ["confirmed", "accepted", "in_progress", "awaiting_payment", "paid"] }
    });
    if (conflictingAppointment) {
        throw new Error("This time slot is already booked");
    }
    // Create the Appointment
    const appointment = await appointment_model_1.Appointment.create({
        customer: customerId,
        provider,
        date: requestedDate,
        startTime,
        endTime,
        service,
        paymentMethod,
        status: "pending",
        price: providerUser.providerProfile.hourlyRate
    });
    // Send Notification to Provider
    await notification_service_1.NotificationService.insertNotification({
        title: "New Appointment Request",
        message: `You have a new appointment request for ${service} on ${date}`,
        receiver: provider,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER"
    });
    // Socket notification for real-time update in UI list (sorting)
    //@ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`appointmentUpdate::${provider}`, appointment);
    }
    return appointment;
};
exports.createAppointment = createAppointment;
const updateAppointmentStatus = async (appointmentId, status, userId, userRole, reason, data) => {
    var _a;
    const appointment = await appointment_model_1.Appointment.findById(appointmentId);
    if (!appointment)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    // 1. Permission Check
    const isCustomer = (userRole === null || userRole === void 0 ? void 0 : userRole.toUpperCase()) === user_1.USER_ROLES.CUSTOMER && appointment.customer.toString() === userId.toString();
    const isProvider = (userRole === null || userRole === void 0 ? void 0 : userRole.toUpperCase()) === user_1.USER_ROLES.PROVIDER && appointment.provider.toString() === userId.toString();
    if (!isCustomer && !isProvider) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Permission denied! Only the assigned user can update this.");
    }
    // 2. Status Transition Validation
    const currentStatus = appointment.status;
    // New strict transition rules
    const allowedTransitions = {
        pending: ["accepted", "rejected", "cancelled"], // Provider: accepted/rejected, Customer: cancelled
        accepted: ["in_progress"], // Provider only
        in_progress: ["work_completed"], // Provider only
        work_completed: ["awaiting_payment"],
        awaiting_payment: ["review_pending", "cashPayment"],
        cashPayment: ["cashReceived"],
    };
    // Check if transition is generally allowed
    if (!((_a = allowedTransitions[currentStatus]) === null || _a === void 0 ? void 0 : _a.includes(status))) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Cannot move appointment from '${currentStatus}' to '${status}'.`);
    }
    // Role-specific restrictions
    if (status === "cancelled" && !isCustomer) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only customers can cancel appointments.");
    }
    if (["cancelled", "rejected"].includes(status)) {
        if (!reason) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `A reason is required to ${status} this appointment.`);
        }
        appointment.reason = reason;
    }
    if (status === "cancelled" && isCustomer && currentStatus !== "pending") {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Can only cancel 'pending' appointments.");
    }
    if (["accepted", "rejected", "in_progress", "work_completed"].includes(status) && !isProvider) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, `Only providers can set status to '${status}'.`);
    }
    if (["review_pending", "cashPayment"].includes(status) && !isCustomer) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only customers can finalize payment.");
    }
    if (status === "cashReceived" && !isProvider) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Only providers can confirm cash receipt.");
    }
    // 3. Status Specific Actions
    if (status === "in_progress") {
        const activeAppointment = await appointment_model_1.Appointment.findOne({
            provider: appointment.provider,
            status: {
                $in: [
                    "in_progress",
                    "work_completed",
                    "awaiting_payment",
                    "review_pending",
                    "provider_review_pending",
                    "cashPayment",
                    "cashReceived",
                ],
            },
            _id: { $ne: appointment._id },
        });
        if (activeAppointment) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Complete your previous work first! You already have an active appointment.");
        }
        appointment.actualStartTime = formatTime(new Date());
        appointment.status = status;
    }
    if (status === "work_completed") {
        appointment.actualEndTime = formatTime(new Date());
        await handleAppointmentCompletion(appointment);
        appointment.status = "awaiting_payment";
    }
    if (status === "review_pending") {
        appointment.status = "review_pending";
    }
    if (status === "cashPayment") {
        appointment.paymentMethod = "cash";
        appointment.status = "cashPayment";
    }
    if (status === "cashReceived") {
        appointment.status = "review_pending";
    }
    // Update status for other valid transitions if not already handled
    if (!["work_completed", "in_progress", "review_pending", "cashPayment", "cashReceived"].includes(status)) {
        appointment.status = status;
    }
    await appointment.save();
    // 4. Send Notifications
    await sendStatusNotification(appointment, status);
    // 5. Socket notification for real-time update in UI list (sorting)
    //@ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`appointmentUpdate::${appointment.customer.toString()}`, appointment);
        io.emit(`appointmentUpdate::${appointment.provider.toString()}`, appointment);
    }
    return appointment;
};
exports.updateAppointmentStatus = updateAppointmentStatus;
/**
 * Handle complex logic for completing an appointment
 */
async function handleAppointmentCompletion(appointment) {
    var _a;
    const provider = await user_model_1.User.findById(appointment.provider);
    if (appointment.actualStartTime && appointment.actualEndTime) {
        const start = new Date(appointment.date);
        const [sHours, sMins] = appointment.actualStartTime.split(":");
        start.setHours(Number(sHours), Number(sMins), 0, 0);
        const end = new Date(appointment.date);
        const [eHours, eMins] = appointment.actualEndTime.split(":");
        end.setHours(Number(eHours), Number(eMins), 0, 0);
        const durationMs = end.getTime() - start.getTime();
        const hours = durationMs / (1000 * 60 * 60);
        appointment.totalWorkedTime = parseFloat(hours.toFixed(2));
        if ((_a = provider === null || provider === void 0 ? void 0 : provider.providerProfile) === null || _a === void 0 ? void 0 : _a.hourlyRate) {
            appointment.totalCost = parseFloat((hours * provider.providerProfile.hourlyRate).toFixed(2));
        }
    }
}
/**
 * Centered notification logic
 */
async function sendStatusNotification(appointment, status) {
    const messages = {
        accepted: {
            title: "Appointment Accepted",
            message: `Your appointment for ${appointment.service} has been accepted.`,
            receiver: "customer"
        },
        rejected: {
            title: "Appointment Rejected",
            message: `Your appointment for ${appointment.service} was rejected. Reason: ${appointment.reason || 'N/A'}`,
            receiver: "customer"
        },
        in_progress: {
            title: "Service Started",
            message: `The provider has started the service for your appointment.`,
            receiver: "customer"
        },
        work_completed: {
            title: "Service Completed",
            message: `The service is complete. Total Time: ${appointment.totalWorkedTime} hrs, Total Cost: ${appointment.totalCost}. Please proceed to payment.`,
            receiver: "customer"
        },
        cancelled: {
            title: "Appointment Cancelled",
            message: `The appointment for ${appointment.service} has been cancelled by the customer. Reason: ${appointment.reason || 'N/A'}`,
            receiver: "provider"
        },
        cashPayment: {
            title: "Payment Update: Cash",
            message: `The customer has opted to pay via cash. Please confirm once you receive the payment.`,
            receiver: "provider"
        },
        cashReceived: {
            title: "Payment Confirmed",
            message: `The provider has confirmed your cash payment. Your service is now ready for review.`,
            receiver: "customer"
        },
        review_pending: {
            title: "Payment Processed",
            message: `Payment for appointment ${appointment._id} has been successfully processed.`,
            receiver: "customer"
        }
    };
    const config = messages[status];
    if (config) {
        await notification_service_1.NotificationService.insertNotification({
            title: config.title,
            message: config.message,
            receiver: config.receiver === "customer" ? appointment.customer : appointment.provider,
            referenceId: appointment._id,
            screen: "APPOINTMENT",
            type: "USER",
        });
    }
}
const getAppointmentById = async (appointmentId) => {
    return await appointment_model_1.Appointment.findById(appointmentId)
        .populate("customer", "fullName email phone")
        .populate("provider", "fullName email phone providerProfile");
};
exports.getAppointmentById = getAppointmentById;
const payWithWallet = async (appointmentId, userId) => {
    const appointment = await appointment_model_1.Appointment.findById(appointmentId);
    if (!appointment) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    if (appointment.status !== 'awaiting_payment') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Payment not allowed for appointment in ${appointment.status} status`);
    }
    if (!appointment.totalCost || appointment.totalCost <= 0) {
        throw new Error("Invalid appointment cost");
    }
    if (appointment.customer.toString() !== userId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "This is not your appointment");
    }
    // Use WalletService to transfer money from customer to provider
    // Note: We might want a specialized transaction type for appointments, 
    // but for now we follow the existing sendMoney pattern.
    await (0, checkSetting_1.checkWalletSetting)('moneySend');
    await wallet_service_1.WalletService.sendMoney(appointment.customer.toString(), appointment.provider.toString(), appointment.totalCost);
    // Update appointment status
    appointment.status = 'review_pending';
    await appointment.save();
    // Notify Provider
    await notification_service_1.NotificationService.insertNotification({
        title: "Payment Received",
        message: `Payment received for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
        receiver: appointment.provider,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER"
    });
    // Notify Customer
    await notification_service_1.NotificationService.insertNotification({
        title: "Payment Successful",
        message: `Your wallet payment of ${appointment.totalCost} for appointment ${appointmentId} was successful.`,
        receiver: appointment.customer,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER"
    });
    // also emit socket for real-time update
    //@ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`appointmentUpdate::${appointment.customer.toString()}`, appointment);
        io.emit(`appointmentUpdate::${appointment.provider.toString()}`, appointment);
    }
    return appointment;
};
const getMyAppointments = async (user, query) => {
    const { role, id } = user;
    if ((role === null || role === void 0 ? void 0 : role.toUpperCase()) === user_1.USER_ROLES.CUSTOMER) {
        query.customer = id;
    }
    else if ((role === null || role === void 0 ? void 0 : role.toUpperCase()) === user_1.USER_ROLES.PROVIDER) {
        query.provider = id;
    }
    const appointmentQuery = new QueryBuilder_1.default(appointment_model_1.Appointment.find().populate("customer provider"), query)
        .filter()
        .sort(query.sort || "-updatedAt")
        .paginate();
    const result = await appointmentQuery.modelQuery;
    const meta = await appointmentQuery.getPaginationInfo();
    return { result, meta };
};
const getAllAppointmentsFromDB = async (query) => {
    const appointmentQuery = new QueryBuilder_1.default(appointment_model_1.Appointment.find().populate("customer provider"), query)
        .filter()
        .sort()
        .paginate();
    const result = await appointmentQuery.modelQuery;
    const meta = await appointmentQuery.getPaginationInfo();
    return { result, meta };
};
const getCurrentAppointment = async (user) => {
    const { role, id } = user;
    const query = {
        status: {
            $in: [
                "in_progress",
                "work_completed",
                "awaiting_payment",
                "cashPayment",
                "cashReceived",
                "review_pending",
                "provider_review_pending",
                "customer_review_pending",
            ],
        },
    };
    if ((role === null || role === void 0 ? void 0 : role.toUpperCase()) === user_1.USER_ROLES.CUSTOMER) {
        query.customer = id;
    }
    else if ((role === null || role === void 0 ? void 0 : role.toUpperCase()) === user_1.USER_ROLES.PROVIDER) {
        query.provider = id;
    }
    const result = await appointment_model_1.Appointment.findOne(query)
        .populate("customer", "fullName email phone profilePicture")
        .populate("provider", "fullName email phone profilePicture providerProfile")
        .sort("-updatedAt");
    return result;
};
// Helper function to format time to "HH:MM" format
function formatTime(time) {
    return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
}
exports.AppointmentService = {
    createAppointment: exports.createAppointment,
    payWithWallet,
    updateAppointmentStatus: exports.updateAppointmentStatus,
    getMyAppointments,
    getAllAppointmentsFromDB,
    getCurrentAppointment
};
