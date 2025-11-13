import { StatusCodes } from "http-status-codes";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelper } from "../../../helpers/jwtHelper";
import { ILoginData, IVerifyEmail } from "../../../types/auth";
import generateOTP from "../../../util/generateOTP";
import { User } from "../user/user.model";
import { IUser } from "../user/user.interface";
import { validPhoneNumberCheck } from "../../../util/validPhoneNumberCheck";
import mongoose from "mongoose";
import sendSMS from "../../../shared/sendSMS";
import { USER_ROLES } from "../../../enums/user";
import { emailHelper } from "../../../helpers/emailHelper";
import { emailTemplate } from "../../../shared/emailTemplate";

const loginAdminFromDB = async (payload: ILoginData) => {
  const { email, password } = payload;
  const isExistUser: any = await User.findOne({ email }).select("+password");
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //check verified and status
  if (!isExistUser.isEmailVerified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Please verify your email, then try to login again"
    );
  }

  //check match password
  if (
    password &&
    !(await User.isMatchPassword(password, isExistUser.password))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password is incorrect!");
  }

  // Create JWT tokens in parallel
  const [accessToken, refreshToken] = await Promise.all([
    jwtHelper.createToken(
      { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    ),
    jwtHelper.createToken(
      { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
      config.jwt.jwtRefreshSecret as Secret,
      config.jwt.jwtRefreshExpiresIn as string
    ),
  ]);

  return { accessToken, refreshToken };
};

const loginUserFromDB = async (payload: ILoginData) => {
  const { phone } = payload;

  // Validate phone number
  if (!validPhoneNumberCheck(phone as string)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid phone number. Please enter a valid number to receive an OTP."
    );
  }

  const existingUser: (IUser & { _id: mongoose.Types.ObjectId }) | null =
    await User.findOne({ phone });

  console.log(existingUser);

  if (!existingUser?.isPhoneVerified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Please verify your phone number, then try to login again"
    );
  }

  if (!existingUser) {
    return { register: true, verify: false };
  }

  // Generate OTP
  const otp = generateOTP();
  const authentication = {
    purpose: "login_otp",
    channel: "phone",
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await User.updateOne({ _id: existingUser._id }, { $set: { authentication } });

  await sendSMS(phone as string, otp.toString());

  return { register: false, verify: true };
};

const verifyPhoneToDB = async (payload: IVerifyEmail) => {
  const { phone, oneTimeCode } = payload;

  const isExistUser = await User.findOne({ phone }).select("+authentication");
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (!oneTimeCode) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Please provide the OTP, check your phone we sent a code"
    );
  }

  if (isExistUser.authentication?.oneTimeCode !== oneTimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You provided wrong OTP");
  }

  const date = new Date();
  if (date > isExistUser.authentication?.expireAt) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "OTP has expired, please try again"
    );
  }

  // Update phone verification status
  await User.findOneAndUpdate(
    { _id: isExistUser._id },
    { 
      isPhoneVerified: true, 
      authentication: null 
    }
  );

  // Create tokens
  const accessToken = await jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      phone: isExistUser.phone,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  const refreshToken = await jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      phone: isExistUser.phone,
    },
    config.jwt.jwtRefreshSecret as Secret,
    config.jwt.jwtRefreshExpiresIn as string
  );

  const data = {
    accessToken,
    role: isExistUser.role,
    refreshToken,
  };
  const message = "Phone number verified successfully.";

  return { data, message };
};

const newAccessTokenToUser = async (token: string) => {
  // Check if the token is provided
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Token is required!");
  }

  const verifyUser = jwtHelper.verifyToken(
    token,
    config.jwt.jwtRefreshSecret as Secret
  );

  const isExistUser = await User.findById(verifyUser?.id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access");
  }

  // Create token
  const accessToken = await jwtHelper.createToken(
    { id: isExistUser._id, role: isExistUser.role, phone: isExistUser.phone },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  return { accessToken };
};

const resendVerificationOTPToDB = async (phone: string) => {
  // Find the user by phone
  const existingUser: (IUser & { _id: mongoose.Types.ObjectId }) | null =
    await User.findOne({ phone }).lean();

  if (!existingUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User with this phone number does not exist!"
    );
  }

  if (existingUser?.isPhoneVerified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number is already verified!");
  }

  // Generate OTP
  const otp = generateOTP();
  const authentication = {
    purpose: "phone_verify",
    channel: "phone",
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await sendSMS(phone, otp.toString());

  await User.updateOne({ _id: existingUser._id }, { $set: { authentication } });
};

// delete user
const deleteUserFromDB = async (user: JwtPayload, phone: string) => {
  // Validate phone number
  if (!validPhoneNumberCheck(phone)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid phone number. Please enter a valid number to receive an OTP."
    );
  }

  const isExistUser = await User.findOne({ phone });
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // Generate OTP
  const otp = generateOTP();
  const authentication = {
    purpose: "phone_verify",
    channel: "phone",
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await sendSMS(phone, otp.toString());

  await User.updateOne(
    { _id: isExistUser?._id },
    { $set: { authentication } }
  );
  
  return "Verification OTP sent to your phone number. Kindly verify to delete your account";
};

const sendEmailOtp = async (data: { email: string; role: USER_ROLES }) => {
  const otp = generateOTP();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);

  // Simply create new user with OTP
  const user = await User.create({
    email: data.email,
    role: data.role,
    isEmailVerified: false,
    authentication: {
      purpose: "email_verify",
      channel: "email",
      oneTimeCode: otp,
      expireAt,
    }
  });

  const emailContent = emailTemplate.createAccount({
    email: data.email,
    otp,
  });

  await emailHelper.sendEmail(emailContent);

  return { userId: user._id, email: data.email };
};

const sendPhoneOtp = async (payload: { phone: string; id: string }) => {
  const otp = generateOTP();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);

  // First find the user
  const user = await User.findById(payload.id);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Update user fields
  user.phone = payload.phone;
  user.authentication = {
    purpose: "phone_verify",
    channel: "phone",
    oneTimeCode: otp,
    expireAt,
  };
  user.isPhoneVerified = false;

  // Save the user (this will trigger validations)
  await user.save();

  // Send SMS after saving user
  await sendSMS(payload.phone, otp.toString());

  return { userId: user._id, phone: payload.phone };
};


const sendPasswordResetOtp = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

  const otp = generateOTP();
  user.authentication = {
    purpose: "password_reset",
    channel: "email",
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await user.save();

  const emailContent = emailTemplate.resetPassword({ email, otp });
  await emailHelper.sendEmail(emailContent);

  return { email };
};

const sendNumberChangeOtp = async (oldPhone: string, newPhone: string) => {
  const user = await User.findOne({ phone: oldPhone });
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "Old phone not found");

  const otp = generateOTP();
  user.authentication = {
    purpose: "number_change",
    channel: "phone",
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await user.save();
  await sendSMS(newPhone, otp.toString());

  return { oldPhone, newPhone };
};

/**
 * ✅ Common OTP Verification
 * Works for any purpose & channel
 */
const verifyOtp = async (payload: {
  purpose: string;
  channel: "email" | "phone";
  identifier: string;
  oneTimeCode: number;
}) => {
  const { purpose, channel, identifier, oneTimeCode } = payload;

  const query = channel === "email" ? { email: identifier } : { phone: identifier };

  const user = await User.findOne(query).select("+authentication");
  if (!user || !user.authentication) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User or OTP not found");
  }

  const auth = user.authentication;

  if (auth.purpose !== purpose)
    throw new ApiError(StatusCodes.BAD_REQUEST, "OTP purpose mismatch");
  if (auth.channel !== channel)
    throw new ApiError(StatusCodes.BAD_REQUEST, "OTP channel mismatch");
  if (auth.oneTimeCode !== Number(oneTimeCode))
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid OTP");
  if (new Date() > new Date(auth.expireAt))
    throw new ApiError(StatusCodes.BAD_REQUEST, "OTP expired");

  // ✅ Mark verified according to purpose
  if (purpose === "email_verify") user.isEmailVerified = true;
  if (purpose === "phone_verify") user.isPhoneVerified = true;

  // Clear authentication
  user.authentication = undefined as any;
  await user.save();

  return {
    message: `${purpose.replace('_', ' ')} verified successfully`,
    data: { userId: user._id },
  };
};

export const AuthService = {
  loginUserFromDB,
  verifyPhoneToDB,
  resendVerificationOTPToDB,
  newAccessTokenToUser,
  deleteUserFromDB,
  loginAdminFromDB,
  sendEmailOtp,
  sendPhoneOtp,
  sendPasswordResetOtp,
  sendNumberChangeOtp,
  verifyOtp,
};