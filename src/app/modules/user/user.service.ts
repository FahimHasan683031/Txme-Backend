import { IUser } from "./user.interface";
import { JwtPayload } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import generateOTP from "../../../util/generateOTP";
import unlinkFile from "../../../shared/unlinkFile";
import sendSMS from "../../../shared/sendSMS";
import { emailHelper } from "../../../helpers/emailHelper";
import { ADMIN_ROLES } from "../../../enums/user";
import QueryBuilder from "../../../helpers/QueryBuilder";


// get all users
const getAllUsers = async (
  user: JwtPayload,
  query: Record<string, unknown>
) => {
  if (user.role === "CUSTOMER" || user.role === "PROVIDER") {
    query.role = "PROVIDER";
  }

  const userQueryBuilder = new QueryBuilder(User.find(), query)
    .geolocation()
    .providerFilter()
    .filter()
    .search(["fullName", "email", "phone", "providerProfile.serviceCategory", "providerProfile.skills"])
    .sort()
    .paginate();

  const users = await userQueryBuilder.modelQuery;
  const paginateInfo = await userQueryBuilder.getPaginationInfo();

  return { data: users, pagination: paginateInfo };
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;

  const isExistUser = await User.findById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // ✅ Fix for profilePicture field name
  if (payload.profilePicture && isExistUser.profilePicture) {
    unlinkFile(isExistUser.profilePicture);
  }

  if (payload.providerProfile) {
    const { workingHours, hourlyRate, experience } = payload.providerProfile;

    // Validate Working Hours
    if (workingHours) {
      if (!workingHours.startTime || !workingHours.endTime || !workingHours.duration) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Start time, end time, and slot duration are all required!");
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(workingHours.startTime) || !timeRegex.test(workingHours.endTime)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid time format. Please use HH:MM (24-hour format).");
      }

      const [startH, startM] = workingHours.startTime.split(":").map(Number);
      const [endH, endM] = workingHours.endTime.split(":").map(Number);

      const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (totalMinutes <= 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "End time must be after start time (same day only).");
      }

      const slotDurationMinutes = workingHours.duration * 60;
      if (slotDurationMinutes <= 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Slot duration must be positive.");
      }

      if (totalMinutes < slotDurationMinutes) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Shift duration must be at least as long as a slot.");
      }

      if (totalMinutes % slotDurationMinutes !== 0) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Shift duration (${totalMinutes / 60}h) is not perfectly divisible by slot duration (${workingHours.duration}h).`
        );
      }
    }

    // Validate Hourly Rate
    if (hourlyRate !== undefined && hourlyRate <= 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Hourly rate must be a positive number.");
    }

    // Validate Experience
    if (experience !== undefined && experience < 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Experience cannot be a negative number.");
    }
  }


  const updatedUser = await User.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return updatedUser;
};

const getSingleUser = async (id: string): Promise<IUser | null> => {
  const user = await User.findById(id);
  return user;
}

const getmyProfile = async (user: JwtPayload): Promise<IUser | null> => {
  const { id } = user;
  const result = await User.findById(id);
  return result;
}



// update user status
const updateUserStatusInDB = async (userId: string, status: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  const validStatuses = ['pending', 'active', 'rejected', 'suspended', 'blocked', 'deleted'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { status },
    { new: true }
  ).select('-authentication');

  return updatedUser;
};

// delete user (soft delete)
const deleteUserFromDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  if (user.status === 'deleted') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already deleted');
  }

  await User.findByIdAndUpdate(
    userId,
    { status: 'deleted' },
    { new: true }
  );

  return { message: 'User deleted successfully' };
};

const updateFcmTokenToDB = async (user: JwtPayload, token: string) => {
  const { id } = user;
  const result = await User.findByIdAndUpdate(
    id,
    { fcmToken: token },
    { new: true }
  );
  return result;
};

export const UserService = {
  getAllUsers,
  updateProfileToDB,
  getSingleUser,
  getmyProfile,

  updateUserStatusInDB,
  deleteUserFromDB,
  updateFcmTokenToDB
};
