import { USER_ROLES } from "../../../enums/user";
import { Appointment } from "./appointment.model";
import { User } from "../user/user.model";
import { generateDailySlots } from "../../../util/generateDailySlots";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { WalletService } from "../wallet/wallet.service";
import { NotificationService } from "../notification/notification.service";
import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../../../helpers/QueryBuilder";


export const createAppointment = async (customerId: string, data: any) => {
  const { provider, date, startTime, endTime, service, paymentMethod } = data;

  // Validate provider exists and has provider profile
  const providerUser = await User.findOne({
    _id: provider,
    "providerProfile": { $exists: true }
  });

  if (!providerUser?.providerProfile) {
    throw new Error("Provider profile not found");
  }

  // Check if provider is available on the requested date
  const requestedDate = new Date(date);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = days[requestedDate.getUTCDay()] as any;

  if (!providerUser.providerProfile.workingDays.includes(dayOfWeek)) {
    throw new Error("Provider not available on this day");
  }

  // Check if provider has set this specific date as unavailable
  const isUnavailableDate = providerUser.providerProfile.unavailableDates?.some(
    (d: Date) => d.toISOString().split('T')[0] === requestedDate.toISOString().split('T')[0]
  );

  if (isUnavailableDate) {
    throw new Error("Provider is unavailable on this date");
  }

  // Generate valid slots for the provider
  const validSlots = generateDailySlots(providerUser.providerProfile.workingHours, date);

  // Validate the requested slot
  const isValidSlot = validSlots.some(
    slot => slot.startTime === startTime && slot.endTime === endTime
  );

  if (!isValidSlot) {
    throw new Error("Invalid time slot");
  }

  // Check for existing Appointments in the same time slot
  const conflictingAppointment = await Appointment.findOne({
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
  const appointment = await Appointment.create({
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
  await NotificationService.insertNotification({
    title: "New Appointment Request",
    message: `You have a new appointment request for ${service} on ${date}`,
    receiver: provider,
    referenceId: appointment._id,
    screen: "APPOINTMENT",
    type: "USER"
  });

  return appointment;
};


export const updateAppointmentStatus = async (
  appointmentId: string,
  status: string,
  userId: string,
  userRole: string,
  reason?: string,
  data?: any
) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");

  // 1. Permission Check
  const isCustomer = userRole?.toUpperCase() === USER_ROLES.CUSTOMER && appointment.customer.toString() === userId.toString();
  const isProvider = userRole?.toUpperCase() === USER_ROLES.PROVIDER && appointment.provider.toString() === userId.toString();

  if (!isCustomer && !isProvider) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Permission denied! Only the assigned user can update this.");
  }

  // 2. Status Transition Validation
  const currentStatus = appointment.status;

  // New strict transition rules
  const allowedTransitions: Record<string, string[]> = {
    pending: ["accepted", "rejected", "cancelled"], // Provider: accepted/rejected, Customer: cancelled
    accepted: ["in_progress"],                      // Provider only
    in_progress: ["work_completed"],                 // Provider only
    work_completed: ["awaiting_payment"],
    awaiting_payment: ["review_pending", "cashPayment"],
    cashPayment: ["cashReceived"],
  };

  // Check if transition is generally allowed
  if (!allowedTransitions[currentStatus]?.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Cannot move appointment from '${currentStatus}' to '${status}'.`);
  }

  // Role-specific restrictions
  if (status === "cancelled" && !isCustomer) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only customers can cancel appointments.");
  }

  if (["cancelled", "rejected"].includes(status)) {
    if (!reason) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `A reason is required to ${status} this appointment.`);
    }
    appointment.reason = reason;
  }

  if (status === "cancelled" && isCustomer && currentStatus !== "pending") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Can only cancel 'pending' appointments.");
  }

  if (["accepted", "rejected", "in_progress", "work_completed"].includes(status) && !isProvider) {
    throw new ApiError(StatusCodes.FORBIDDEN, `Only providers can set status to '${status}'.`);
  }

  if (["review_pending", "cashPayment"].includes(status) && !isCustomer) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only customers can finalize payment.");
  }

  if (status === "cashReceived" && !isProvider) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only providers can confirm cash receipt.");
  }

  // 3. Status Specific Actions
  if (status === "in_progress") {
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
    appointment.status = status as any;
  }

  await appointment.save();

  // 4. Send Notifications
  await sendStatusNotification(appointment, status);

  return appointment;
};

/**
 * Handle complex logic for completing an appointment
 */
async function handleAppointmentCompletion(appointment: any) {
  const provider = await User.findById(appointment.provider);
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

    if (provider?.providerProfile?.hourlyRate) {
      appointment.totalCost = parseFloat((hours * provider.providerProfile.hourlyRate).toFixed(2));
    }
  }
}

/**
 * Centered notification logic
 */
async function sendStatusNotification(appointment: any, status: string) {
  const messages: Record<string, { title: string; message: string; receiver: "customer" | "provider" }> = {
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
    await NotificationService.insertNotification({
      title: config.title,
      message: config.message,
      receiver: config.receiver === "customer" ? appointment.customer : appointment.provider,
      referenceId: appointment._id,
      screen: "APPOINTMENT",
      type: "USER",
    });
  }
}

export const getAppointmentById = async (appointmentId: string) => {
  return await Appointment.findById(appointmentId)
    .populate("customer", "fullName email phone")
    .populate("provider", "fullName email phone providerProfile");
};



const payWithWallet = async (appointmentId: string, userId: string) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");
  }

  if (appointment.status !== 'awaiting_payment') {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Payment not allowed for appointment in ${appointment.status} status`);
  }

  if (!appointment.totalCost || appointment.totalCost <= 0) {
    throw new Error("Invalid appointment cost");
  }

  if (appointment.customer.toString() !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "This is not your appointment");
  }

  // Use WalletService to transfer money from customer to provider
  // Note: We might want a specialized transaction type for appointments, 
  // but for now we follow the existing sendMoney pattern.
  await WalletService.sendMoney(
    appointment.customer.toString(),
    appointment.provider.toString(),
    appointment.totalCost
  );

  // Update appointment status
  appointment.status = 'review_pending';
  await appointment.save();

  // Notify Provider
  await NotificationService.insertNotification({
    title: "Payment Received",
    message: `Payment received for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
    receiver: appointment.provider,
    referenceId: appointment._id,
    screen: "APPOINTMENT",
    type: "USER"
  });

  // Notify Customer
  await NotificationService.insertNotification({
    title: "Payment Successful",
    message: `Your wallet payment of ${appointment.totalCost} for appointment ${appointmentId} was successful.`,
    receiver: appointment.customer,
    referenceId: appointment._id,
    screen: "APPOINTMENT",
    type: "USER"
  });

  return appointment;
};

const getMyAppointments = async (user: JwtPayload, query: Record<string, any>) => {
  const { role, id } = user;

  if (role?.toUpperCase() === USER_ROLES.CUSTOMER) {
    query.customer = id;
  } else if (role?.toUpperCase() === USER_ROLES.PROVIDER) {
    query.provider = id;
  }

  const appointmentQuery = new QueryBuilder(
    Appointment.find().populate("customer provider"),
    query
  )
    .filter()
    .sort()
    .paginate();

  const result = await appointmentQuery.modelQuery;
  const meta = await appointmentQuery.getPaginationInfo();

  return { result, meta };
};

const getAllAppointmentsFromDB = async (query: Record<string, any>) => {
  const appointmentQuery = new QueryBuilder(
    Appointment.find().populate("customer provider"),
    query
  )
    .filter()
    .sort()
    .paginate();

  const result = await appointmentQuery.modelQuery;
  const meta = await appointmentQuery.getPaginationInfo();

  return { result, meta };
};

// Helper function to format time to "HH:MM" format
function formatTime(time: Date): string {
  return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
}

export const AppointmentService = {
  createAppointment,
  payWithWallet,
  updateAppointmentStatus,
  getMyAppointments,
  getAllAppointmentsFromDB
}
