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

  const totalUsers = await User.countDocuments({status: {$ne: "deleted"}});

  const userQueryBuilder = new QueryBuilder(User.find({status: {$ne: "deleted"}}), query)
    .geolocation()
    .providerFilter()
    .filter()
    .search(["fullName", "email", "phone", "providerProfile.serviceCategory", "providerProfile.skills"])
    .sort()
    .paginate();

  const users = await userQueryBuilder.modelQuery;
  const paginateInfo = await userQueryBuilder.getPaginationInfo();

  return { data: users, pagination: {...paginateInfo, totalData: totalUsers} };
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

  // Update fields
  if (payload.providerProfile) {
    if (!isExistUser.providerProfile) {
      // If profile doesn't exist, create it with payload
      isExistUser.providerProfile = payload.providerProfile as any;
    } else {
      // If profile exists, update specific fields
      // We iterate keys to ensure we update the subdocument properties
      for (const [key, value] of Object.entries(payload.providerProfile)) {
        // @ts-ignore
        isExistUser.providerProfile[key] = value;
      }
    }
    // Remove from payload to prevent top-level overwrite attempt (though set handles paths)
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
