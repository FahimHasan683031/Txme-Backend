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
import { Appointment } from "../appointment/appointment.model";
import { Review } from "../review/review.model";
import { Types } from "mongoose";


// get all users
const getAllUsers = async (
  user: JwtPayload,
  query: Record<string, unknown>
) => {
  if (user.role === "CUSTOMER" || user.role === "PROVIDER") {
    query.role = "PROVIDER";
  }

  const totalUsers = await User.countDocuments({ status: { $ne: "deleted" } });

  // ✅ Force sort by isPromoted first, then Rating, then user preference
  if (query.role === "PROVIDER") {
    const userSort = (query.sort as string) || '-createdAt';
    query.sort = `-isPromoted -review.averageRating ${userSort}`;
  }

  const userQueryBuilder = new QueryBuilder(User.find({ status: { $ne: "deleted" } }), query)
    .geolocation()
    .providerFilter()
    .filter()
    .search(["fullName", "email", "phone", "providerProfile.serviceCategory", "providerProfile.skills"])
    .sort()
    .paginate();

  const users = await userQueryBuilder.modelQuery;
  const paginateInfo = await userQueryBuilder.getPaginationInfo();

  return { data: users, pagination: { ...paginateInfo, totalData: totalUsers } };
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

const getSingleUser = async (id: string): Promise<any> => {
  const user = await User.findById(id).select("-authentication");
  if (!user) return null;

  const stats = await getUserStats(user);
  return {
    ...user.toObject(),
    ...stats
  };
}

const getmyProfile = async (user: JwtPayload): Promise<any> => {
  const { id } = user;
  const result = await User.findById(id).select("-authentication");
  if (!result) return null;

  const stats = await getUserStats(result);
  return {
    ...result.toObject(),
    ...stats
  };
}

/**
 * Helper to calculate user statistics
 */
async function getUserStats(user: any) {
  const userId = user._id;
  const role = user.role;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const paidStatuses = ["review_pending", "provider_review_pending", "customer_review_pending", "completed"];

  if (role === "PROVIDER") {
    // 1. Total Appointments
    const totalAppointments = await Appointment.countDocuments({ provider: userId });

    // 2. Total Appointments This Month
    const totalAppointmentsThisMonth = await Appointment.countDocuments({
      provider: userId,
      createdAt: { $gte: startOfMonth }
    });

    // 3. Total Earning
    const earningResult = await Appointment.aggregate([
      { $match: { provider: new Types.ObjectId(userId), status: { $in: paidStatuses } } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]);
    const totalEarning = earningResult.length > 0 ? earningResult[0].total : 0;

    // 4. Total Earn This Month
    const monthlyEarningResult = await Appointment.aggregate([
      {
        $match: {
          provider: new Types.ObjectId(userId),
          status: { $in: paidStatuses },
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]);
    const totalEarnThisMonth = monthlyEarningResult.length > 0 ? monthlyEarningResult[0].total : 0;

    // 5. Last 10 Reviews
    const last10Reviews = await Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("reviewer", "fullName profilePicture");

    return {
      totalAppointments,
      totalAppointmentsThisMonth,
      totalEarning,
      totalEarnThisMonth,
      last10Reviews
    };
  } else if (role === "CUSTOMER") {
    // 1. Total Appointments Booked
    const totalAppointmentsBooked = await Appointment.countDocuments({ customer: userId });

    // 2. Total Appointment This Month
    const totalAppointmentsThisMonth = await Appointment.countDocuments({
      customer: userId,
      createdAt: { $gte: startOfMonth }
    });

    // 3. Total Spend
    const spendResult = await Appointment.aggregate([
      { $match: { customer: new Types.ObjectId(userId), status: { $in: paidStatuses } } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]);
    const totalSpend = spendResult.length > 0 ? spendResult[0].total : 0;

    // 4. Total Spend This Month
    const monthlySpendResult = await Appointment.aggregate([
      {
        $match: {
          customer: new Types.ObjectId(userId),
          status: { $in: paidStatuses },
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$totalCost" } } }
    ]);
    const totalSpendThisMonth = monthlySpendResult.length > 0 ? monthlySpendResult[0].total : 0;

    // 5. Last 10 Reviews
    const last10Reviews = await Review.find({ reviewee: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("reviewer", "fullName profilePicture");

    return {
      totalAppointmentsBooked,
      totalAppointmentsThisMonth,
      totalSpend,
      totalSpendThisMonth,
      last10Reviews
    };
  }

  return {};
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
