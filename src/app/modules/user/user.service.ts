import { IUser } from "./user.interface";
import { JwtPayload } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import generateOTP from "../../../util/generateOTP";
import unlinkFile from "../../../shared/unlinkFile";
import sendSMS from "../../../shared/sendSMS";
import { emailHelper } from "../../../helpers/emailHelper";



const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;

  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;

  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // ✅ Fix for profilePicture field name
  if (payload.profilePicture && isExistUser.profilePicture) {
    unlinkFile(isExistUser.profilePicture);
  }

  // ✅ Update user document safely
  const updatedUser = await User.findByIdAndUpdate(id, payload, {
    new: true,
  });

  return updatedUser;
};

const getSingleUser=async (id:string):Promise<IUser|null>=>{
  const user=await User.findById(id);
  return user;
}

export const UserService = {
  getUserProfileFromDB,
  updateProfileToDB,
  getSingleUser
};
