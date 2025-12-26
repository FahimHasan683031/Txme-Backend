import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';
import config from '../../../config';


// create admin
const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const { ...adminData } = req.body;
  const result = await AdminService.createAdminToDB(adminData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Admin created successfully.',
    data: result,
  });
});

// Get all admins
const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const { ...query } = req.query;
  const result = await AdminService.getAllAdminsFromDB(query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Admins fetched successfully.',
    data: result,
  });
});


const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { ...verifyData } = req.body;
  const result = await AdminService.verifyEmailToDB(verifyData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

const loginAdmin = catchAsync(async (req: Request, res: Response) => {
  const { ...loginData } = req.body;
  const result = await AdminService.loginAdminFromDB(loginData);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: result,
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;
  const result = await AdminService.forgetPasswordToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      'Please check your email. We have sent you a one-time passcode (OTP).',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const { ...resetData } = req.body;
  const result = await AdminService.resetPasswordToDB(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully reset.',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { ...passwordData } = req.body;
  await AdminService.changePasswordToDB(user, passwordData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully changed',
  });
});

const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await AdminService.toggleUserStatusInDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User status updated successfully',
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await AdminService.deleteUserFromDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
  });
});

export const AdminController = {
  verifyEmail,
  loginAdmin,
  forgetPassword,
  resetPassword,
  changePassword,
  createAdmin,
  toggleUserStatus,
  deleteUser,
  getAllAdmins
};
