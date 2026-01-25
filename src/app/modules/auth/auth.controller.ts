import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";
import { JwtPayload } from "jsonwebtoken";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUserFromDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User login successfully",
    data: result,
  });
});



const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;
  const result = await AuthService.newAccessTokenToUser(token);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Generate Access Token successfully",
    data: result,
  });
});



const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.deleteUserFromDB(req.user, req.body.phone);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result,
  });
});

// Separate send OTP controllers
const sendEmailOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.sendEmailOtp(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP sent to email",
    data: result,
  });
});

const sendPhoneOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.sendPhoneOtp({
    phone: req.body.phone,
    id: (req.user as JwtPayload).id,
  });
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP sent to phone",
    data: result,
  });
});

const sendPasswordResetOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.sendPasswordResetOtp(req.body.email);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP sent for password reset",
    data: result,
  });
});

const sendNumberChangeOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.sendNumberChangeOtp(
    (req.user as JwtPayload).id,
    req.body.newPhone
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP sent for number change",
    data: result,
  });
});

// Common Verify Controller
const verifyOtp = catchAsync(async (req: Request, res: Response) => {

  const result = await AuthService.verifyOtp(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

const completeProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.completeProfile(req.user as JwtPayload, req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Profile updated successfully",
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resendOtp(req.body.identifier);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "OTP resent successfully",
    data: result,
  });
});

const enableBiometric = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.enableBiometric(req.body.email);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Biometric enabled successfully",
    data: result,
  });
});

const biometricLogin = catchAsync(async (req, res) => {
  const result = await AuthService.biometricLogin(req.body.biometricToken);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Biometric login successful",
    data: result,
  });
});



export const AuthController = {
  sendEmailOtp,
  sendPhoneOtp,
  sendPasswordResetOtp,
  sendNumberChangeOtp,
  verifyOtp,
  loginUser,
  refreshToken,
  deleteUser,
  completeProfile,
  resendOtp,
  enableBiometric,
  biometricLogin,
};
