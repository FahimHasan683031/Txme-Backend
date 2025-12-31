import { User } from "../user/user.model";
import { generateDailySlots } from "../../../util/generateDailySlots";
import { Appointment } from "../appointment/appointment.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import QueryBuilder from "../../../helpers/QueryBuilder";

export const getProviderCalendar = async (providerId: string, date: string) => {
    console.log(providerId, date);

    // Find provider from User model with providerProfile
    const provider = await User.findOne({
        _id: providerId,
        "providerProfile": { $exists: true }
    });

    if (!provider) throw new Error("Provider not found");
    if (!provider.providerProfile) throw new Error("Provider profile not found");

    const workingHours = provider.providerProfile.workingHours;

    // Check if provider works on the requested day
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }) as any;

    if (!provider.providerProfile.workingDays.includes(dayOfWeek)) {
        // Provider doesn't work on this day, throw error
        throw new ApiError(StatusCodes.BAD_REQUEST, "Provider does not work on this day");
    }

    // Check if provider has set this specific date as unavailable
    const isUnavailableDate = provider.providerProfile.unavailableDates?.some(
        (d: Date) => d.toISOString().split('T')[0] === requestedDate.toISOString().split('T')[0]
    );

    if (isUnavailableDate) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Provider is unavailable on this date");
    }

    // generate slots dynamically WITH date
    let slots = generateDailySlots(workingHours, date);


    // find booked slots for that date (exclude only cancelled and rejected)
    const appointments = await Appointment.find({
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

// Helper function to format time to "HH:MM" format
function formatTime(time: any): string {
    if (time instanceof Date) {
        return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    } else if (typeof time === 'string') {
        // If it's already in "HH:MM" format, return as is
        if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
            return time;
        }
    }
    // If it's a different format, you may need additional parsing logic
    return time;
}

export const getPopularProvidersFromDB = async (query: Record<string, unknown>) => {
    // Set default sort by popularity if not specified
    if (!query.sort) {
        query.sort = '-review.averageRating -review.totalReviews';
    }

    const popularQuery = new QueryBuilder(User.find({ role: "PROVIDER" }), query)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await popularQuery.modelQuery;
    const meta = await popularQuery.getPaginationInfo();

    return { data: result, pagination: meta };
};

const getDashboardStats = async (providerId: string) => {
    const provider = await User.findById(providerId);
    if (!provider) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found");
    }

    // Get Total Orders (Completed Appointments)
    const totalOrders = await Appointment.countDocuments({
        provider: providerId,
        status: 'completed'
    });

    return {
        averageRating: provider.review?.averageRating || 0,
        totalOrders,
        experience: provider.providerProfile?.experience || 0
    };
};

export const proveiderServices = {
    getProviderCalendar,
    getPopularProvidersFromDB,
    getDashboardStats
}