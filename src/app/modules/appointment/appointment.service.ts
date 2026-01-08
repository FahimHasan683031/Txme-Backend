import { USER_ROLES } from "../../../enums/user";
import { Appointment } from "./appointment.model";
import { User } from "../user/user.model";
import { generateDailySlots } from "../../../util/generateDailySlots";
import { checkWalletSetting } from "../../../helpers/checkSetting";
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
  console.log(`[AppointmentService] Triggering notification for New Appointment. Provider: ${provider}`);
  try {
    await NotificationService.insertNotification({
      title: "New Appointment Request",
      message: `You have a new appointment request for ${service} on ${date}`,
      receiver: provider,
      referenceId: appointment._id,
      screen: "APPOINTMENT",
      type: "USER"
    });
    console.log(`[AppointmentService] Notification inserted successfully for provider`);
  } catch (error) {
    console.error(`[AppointmentService] Failed to insert new appointment notification:`, error);
  }

  // Socket notification for real-time update in UI list (sorting)
  //@ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`appointmentUpdate::${provider}`, appointment);
  }

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
    pending: ["accepted", "rejected", "cancelled"],
    accepted: ["in_progress"],
    in_progress: ["work_completed"],
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
    const activeAppointment = await Appointment.findOne({
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
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Complete your previous work first! You already have an active appointment."
      );
    }

    appointment.actualStartTime = new Date();
    appointment.status = status;
  }

  if (status === "work_completed") {
    appointment.actualEndTime = new Date();
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

  // 5. Socket notification for real-time update in UI list (sorting)
  //@ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`appointmentUpdate::${appointment.customer.toString()}`, appointment);
    io.emit(`appointmentUpdate::${appointment.provider.toString()}`, appointment);
  }

  return appointment;
};

/**
 * Handle complex logic for completing an appointment
 */
async function handleAppointmentCompletion(appointment: any) {
  const provider = await User.findById(appointment.provider);
  if (appointment.actualStartTime && appointment.actualEndTime) {
    const start = new Date(appointment.actualStartTime);
    const end = new Date(appointment.actualEndTime);

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
    const receiverId = config.receiver === "customer" ? appointment.customer : appointment.provider;
    console.log(`[AppointmentService] Triggering status notification: ${status}. Receiver: ${receiverId}`);
    try {
      await NotificationService.insertNotification({
        title: config.title,
        message: config.message,
        receiver: receiverId,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER",
      });
      console.log(`[AppointmentService] Status notification inserted successfully`);
    } catch (error) {
      console.error(`[AppointmentService] Failed to insert status notification:`, error);
    }
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
  await checkWalletSetting('moneySend');
  await WalletService.sendMoney(
    appointment.customer.toString(),
    appointment.provider.toString(),
    appointment.totalCost
  );

  // Update appointment status
  appointment.status = 'review_pending';
  await appointment.save();

  // Notify Provider
  console.log(`[AppointmentService] Triggering wallet payment notification for provider: ${appointment.provider}`);
  try {
    await NotificationService.insertNotification({
      title: "Payment Received",
      message: `Payment received for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
      receiver: appointment.provider,
      referenceId: appointment._id,
      screen: "APPOINTMENT",
      type: "USER"
    });
  } catch (error) {
    console.error(`[AppointmentService] Failed to notify provider:`, error);
  }

  // Notify Customer
  console.log(`[AppointmentService] Triggering wallet payment notification for customer: ${appointment.customer}`);
  try {
    await NotificationService.insertNotification({
      title: "Payment Successful",
      message: `Your wallet payment of ${appointment.totalCost} for appointment ${appointmentId} was successful.`,
      receiver: appointment.customer,
      referenceId: appointment._id,
      screen: "APPOINTMENT",
      type: "USER"
    });
  } catch (error) {
    console.error(`[AppointmentService] Failed to notify customer:`, error);
  }

  // also emit socket for real-time update
  //@ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`appointmentUpdate::${appointment.customer.toString()}`, appointment);
    io.emit(`appointmentUpdate::${appointment.provider.toString()}`, appointment);
  }

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
    .sort((query.sort as string) || "-updatedAt")
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

const getCurrentAppointment = async (user: JwtPayload) => {
  const { role, id } = user;
  const query: Record<string, any> = {
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

  if (role?.toUpperCase() === USER_ROLES.CUSTOMER) {
    query.customer = id;
  } else if (role?.toUpperCase() === USER_ROLES.PROVIDER) {
    query.provider = id;
  }

  const result = await Appointment.findOne(query)
    .populate("customer", "fullName email phone profilePicture")
    .populate("provider", "fullName email phone profilePicture providerProfile")
    .sort("-updatedAt");

  return result;
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
  getAllAppointmentsFromDB,
  getCurrentAppointment
}
