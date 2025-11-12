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
  if (!isExistUser.verified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Please verify your account, then try to login again"
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

  // if (!existingUser?.verified) {
  //     throw new ApiError(StatusCodes.BAD_REQUEST, "Please verify your account, then try to login again");
  // }

  if (!existingUser) {
    return { register: true, verify: false };
  }

  // Generate OTP
  const otp = generateOTP();
  const authentication = {
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
      "Please give the otp, check your Phone we send a code"
    );
  }

  if (isExistUser.authentication?.oneTimeCode !== oneTimeCode) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You provided wrong otp");
  }

  const date = new Date();
  if (date > isExistUser.authentication?.expireAt) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Otp already expired, Please try again"
    );
  }

  if (isExistUser.isDeleted) {
    await User.findOneAndDelete({ phone });
    const data = null;
    const message = "Your Account deleted Successfully.";
    return { data, message };
  }

  if (isExistUser.verified === true || isExistUser.verified === false) {
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      { verified: true, authentication: { oneTimeCode: null, expireAt: null } }
    );

    //create token
    const accessToken = jwtHelper.createToken(
      {
        id: isExistUser._id,
        role: isExistUser.role,
        subscribe: isExistUser.subscribe,
        phone: isExistUser.phone,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );

    //create token
    const refreshToken = jwtHelper.createToken(
      {
        id: isExistUser._id,
        role: isExistUser.role,
        subscribe: isExistUser.subscribe,
        phone: isExistUser.phone,
      },
      config.jwt.jwtRefreshSecret as Secret,
      config.jwt.jwtRefreshExpiresIn as string
    );

    const data = {
      accessToken,
      role: isExistUser.role,
      subscribe: isExistUser.subscribe,
      refreshToken,
    };
    const message = "Phone Number verified successfully.";

    return { data, message };
  }
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

  //create token
  const accessToken = jwtHelper.createToken(
    { id: isExistUser._id, role: isExistUser.role, phone: isExistUser.phone },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  return { accessToken };
};

const resendVerificationOTPToDB = async (phone: string) => {
  // Find the user by ID
  const existingUser: (IUser & { _id: mongoose.Types.ObjectId }) | null =
    await User.findOne({ phone }).lean();

  if (!existingUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User with this email does not exist!"
    );
  }

  if (existingUser?.verified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User is already verified!");
  }

  // Generate OTP
  const otp = generateOTP();
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await sendSMS(phone as string, otp.toString());

  await User.updateOne({ _id: existingUser._id }, { $set: { authentication } });
};

// delete user
const deleteUserFromDB = async (user: JwtPayload, phone: string) => {
  // Validate phone number
  if (!validPhoneNumberCheck(phone as string)) {
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
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  await sendSMS(phone as string, otp.toString());

  await User.updateOne(
    { _id: isExistUser?._id },
    { $set: { authentication, isDeleted: true } }
  );
  return "Send the Verification OTP to your Phone Number. Kindly verify for the Delete account";
};

const sendEmailOtp = async (data: { email: string; role: USER_ROLES }) => {
  const otp = generateOTP();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);

  let user = await User.findOne({ "email.value": data.email });
  if (!user) {
    user = await User.create({
      email: { value: data.email, isVerified: false },
      role: data.role,
    });
  }

  user.authentication = {
    purpose: "email_verify",
    channel: "email",
    oneTimeCode: otp,
    expireAt,
  };

  await user.save();

  const emailContent = emailTemplate.createAccount({
    email: data.email,
    otp,
  });

  await emailHelper.sendEmail(emailContent);

  return { userId: user._id, email: data.email };
};

const sendPhoneOtp = async (phone: string) => {
  const otp = generateOTP();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);

  let user = await User.findOne({ "phone.value": phone });
  if (!user) {
    user = await User.create({
      phone: { value: phone, isVerified: false },
    });
  }

  user.authentication = {
    purpose: "phone_verify",
    channel: "phone",
    oneTimeCode: otp,
    expireAt,
  };

  await user.save();
  await sendSMS(phone, otp.toString());

  return { userId: user._id, phone };
};

const sendPasswordResetOtp = async (email: string) => {
  const user = await User.findOne({ "email.value": email });
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
  const user = await User.findOne({ "phone.value": oldPhone });
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

  const query =
    channel === "email"
      ? { "email.value": identifier }
      : { "phone.value": identifier };

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
  if (purpose === "email_verify") user.email.isVerified = true;
  if (purpose === "phone_verify") user.phone.isVerified = true;

  // clear authentication
  user.authentication = undefined as any;
  await user.save();

  return {
    message: `${purpose} verified successfully`,
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
