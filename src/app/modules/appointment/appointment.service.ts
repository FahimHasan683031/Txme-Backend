import { Appointment } from "./appointment.model";
import { User } from "../user/user.model";
import { generateDailySlots } from "../../../util/generateDailySlots";


export const createAppointment = async (data: any) => {
  const { customer, provider, date, startTime, endTime, service } = data;

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
  const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

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
    status: { $in: ["confirmed", "pending"] }
  });

  if (conflictingAppointment) {
    throw new Error("This time slot is already booked");
  }

  // Create the Appointment
  const appointment = await Appointment.create({
    customer,
    provider,
    date: requestedDate,
    startTime,
    endTime,
    service,
    status: "confirmed",
    price: providerUser.providerProfile.hourlyRate
  });

  return Appointment;
};


export const updateAppointmentStatus = async (appointmentId: string, status: string, userId: string, userRole: string, data?: any) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error("Appointment not found");

  // Check permissions
  if (userRole === "provider" && appointment.provider.toString() !== userId) {
    throw new Error("Unauthorized");
  }
  if (userRole === "customer" && appointment.customer.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  // Update based on status
  switch (status) {
    case "accepted":
      if (appointment.status !== "pending") throw new Error("Invalid status transition");
      appointment.status = "accepted";
      break;

    case "rejected":
      if (appointment.status !== "pending") throw new Error("Invalid status transition");
      appointment.status = "rejected";
      break;

    case "confirmed":
      if (appointment.status !== "accepted") throw new Error("Invalid status transition");
      appointment.status = "confirmed";
      break;

    case "in_progress":
      if (appointment.status !== "confirmed") throw new Error("Invalid status transition");
      appointment.status = "in_progress";
      appointment.startTime = new Date();
      break;

    case "completed":
      if (appointment.status !== "in_progress") throw new Error("Invalid status transition");
      appointment.status = "completed";
      appointment.endTime = new Date();

      const provider = await User.findById(appointment.provider);

      // Calculate hours and amount
      if (appointment.startTime && appointment.endTime) {
        const hours = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60 * 60);
        appointment.totalWorkedTime = parseFloat(hours.toFixed(2));
        // appointment.totalCost = parseFloat((hours * provider.providerProfile.hourlyRate).toFixed(2));
      }

      // Generate invoice automatically
      appointment.status = "awaiting_payment";
      break;

    case "paid":
      if (appointment.status !== "awaiting_payment") throw new Error("Invalid status transition");
      appointment.status = "paid";
      break;

    case "cancelled":
      if (["in_progress", "completed", "paid"].includes(appointment.status)) {
        throw new Error("Cannot cancel appointment in this status");
      }
      appointment.status = "cancelled";
      break;

    case "no_show":
      if (appointment.status !== "confirmed") throw new Error("Invalid status transition");
      appointment.status = "no_show";
      break;

    default:
      throw new Error("Invalid status");
  }

  await appointment.save();
  return appointment;
};

export const getAppointmentById = async (appointmentId: string) => {
  return await Appointment.findById(appointmentId)
    .populate("customer", "fullName email phone")
    .populate("provider", "fullName email phone providerProfile");
};



export const AppointmentService = {
  createAppointment
}
