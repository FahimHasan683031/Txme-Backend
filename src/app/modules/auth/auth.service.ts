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



const loginUserFromDB = async (payload: ILoginData) => {
  const { email } = payload;

  // Validate email
  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required for login");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please enter a valid email address");
  }

  // Find user by email
  const existingUser = await User.findOne({ email });

  console.log("Login user found:", existingUser);

  // If user doesn't exist
  if (!existingUser) {
    return { 
      register: true, 
      verify: false,
      message: "User not found. Please register first." 
    };
  }

  // Generate OTP for login
  const otp = generateOTP();
  const authentication = {
    purpose: "login_otp",
    channel: "email",
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60 * 1000),
  };

  // Update user with OTP
  await User.updateOne(
    { _id: existingUser._id }, 
    { $set: { authentication } }
  );

  // Send OTP via email
  const emailContent = {
    to: email,
    subject: "Your Login OTP",
    html: `
      <div>
        <h3>Login Verification</h3>
        <p>Your one-time password for login is:</p>
        <h2 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${otp}</h2>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  await emailHelper.sendEmail(emailContent);

  return { 
    success: true,
    message: "Login OTP sent to your email",
    userId: existingUser._id
  };
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

  // ✅ Generate tokens for both login_otp AND email_verify purposes
  let tokens = null;
  if (purpose === "login_otp" || purpose === "email_verify") {
    const [accessToken, refreshToken] = await Promise.all([
      jwtHelper.createToken(
        { 
          id: user._id, 
          role: user.role, 
          email: user.email 
        },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string
      ),
      jwtHelper.createToken(
        { 
          id: user._id, 
          role: user.role, 
          email: user.email 
        },
        config.jwt.jwtRefreshSecret as Secret,
        config.jwt.jwtRefreshExpiresIn as string
      ),
    ]);

    tokens = { accessToken, refreshToken };
  }

  return {
    success: true,
    message: `${purpose.replace('_', ' ')} verified successfully`,
    data: { 
      userId: user._id,
      ...(tokens && { tokens }) // Include tokens for login_otp AND email_verify
    },
  };
};

const completeProfile = async (user: JwtPayload, payload: Partial<IUser>) => {

  console.log(user, payload);

  const userFromDB = await User.findById(user.id);
  if (!userFromDB) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
 
  const res = await User.findByIdAndUpdate(user.id, payload, { new: true });


  return {res};
};

export const AuthService = {
  loginUserFromDB,
  newAccessTokenToUser,
  deleteUserFromDB,
  sendEmailOtp,
  sendPhoneOtp,
  sendPasswordResetOtp,
  sendNumberChangeOtp,
  verifyOtp,
  completeProfile
};