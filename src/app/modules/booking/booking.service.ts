import { Booking } from "./booking.model";
import { User } from "../user/user.model";
import { generateDailySlots } from "../../../util/generateDailySlots";


export const createBooking = async (data: any) => {
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
  
  if (!providerUser.providerProfile.workingHours.workingDays.includes(dayOfWeek)) {
    throw new Error("Provider not available on this day");
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

  // Check for existing bookings in the same time slot
  const conflictingBooking = await Booking.findOne({ 
    provider, 
    date: requestedDate,
    startTime,
    endTime,
    status: { $in: ["confirmed", "pending"] }
  });
  
  if (conflictingBooking) {
    throw new Error("This time slot is already booked");
  }

  // Create the booking
  const booking = await Booking.create({
    customer,
    provider,
    date: requestedDate,
    startTime,
    endTime,
    service,
    status: "confirmed",
    price: providerUser.providerProfile.pricePerSlot 
  });
  
  return booking;
};

export const bookingService = {
    createBooking
}
