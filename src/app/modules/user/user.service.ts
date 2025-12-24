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

  return { data: users, meta: paginateInfo };
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

  if (payload.providerProfile?.workingHours) {
    const workingHours = payload.providerProfile.workingHours;
    if (!workingHours.startTime || !workingHours.endTime || !workingHours.duration) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Working hours is required!");
    }

    const [startH, startM] = workingHours.startTime.split(":").map(Number);
    const [endH, endM] = workingHours.endTime.split(":").map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const slotDurationMinutes = workingHours.duration * 60;

    if (totalMinutes <= 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "End time must be after start time");
    }

    if (totalMinutes % slotDurationMinutes !== 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `The slot duration (${workingHours.duration} hours) does not fit perfectly into the working hours (${workingHours.startTime} - ${workingHours.endTime}).`
      );
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

const getPopularProvidersFromDB = async () => {
  const result = await User.find({
    role: "PROVIDER",
    status: "active",
  })
    .sort({ "review.averageRating": -1, "review.totalReviews": -1 })
    .limit(5);

  return result;
};

export const UserService = {
  getAllUsers,
  updateProfileToDB,
  getSingleUser,
  getmyProfile,
  getPopularProvidersFromDB
};
