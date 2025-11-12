import { IUser } from "./user.interface";
import { JwtPayload } from "jsonwebtoken";
import { User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import generateOTP from "../../../util/generateOTP";
import unlinkFile from "../../../shared/unlinkFile";
import sendSMS from "../../../shared/sendSMS";
import { emailHelper } from "../../../helpers/emailHelper";

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  // ✅ Adjusted to match nested structure (email.value and phone.value)
  const isExistUser = await User.findOne({
    "email.value": payload.email?.value,
    "phone.value": payload.phone?.value,
  });

  if (isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User already exists");
  }

  // ✅ Create user
  const createdUser = await User.create(payload);
  if (!createdUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create user");
  }

  // ✅ Generate OTP for authentication
  const otp = generateOTP();
  const authentication = {
    purpose: "email_verify",
    channel: "email",
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  console.log("OTP:", otp);

  // Optionally send OTP
  // if (payload.phone?.value) await sendSMS(payload.phone.value, otp.toString());
  // if (payload.email?.value) await emailHelper.sendEmail(payload.email.value, otp);

  // ✅ Update user authentication info
  await User.findByIdAndUpdate(createdUser._id, {
    $set: { authentication },
  });

  return createdUser;
};

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

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
};
