import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';


const loginUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginUserFromDB(req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'User login successfully',
        data: result
    });
});

const loginAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.loginAdminFromDB(req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Admin login successfully',
        data: result
    });
});

const verifyPhone = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.verifyPhoneToDB(req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result?.message,
        data: result?.data
    });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await AuthService.newAccessTokenToUser(token);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Generate Access Token successfully',
        data: result
    });
});

const resendVerificationOTP = catchAsync(async (req: Request, res: Response) => {
    const { phone } = req.body;
    const result = await AuthService.resendVerificationOTPToDB(phone);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Generate OTP and send successfully',
        data: result
    });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.deleteUserFromDB(req.user, req.body.phone);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: result
    });
});

export const AuthController = {
    loginUser,
    verifyPhone,
    refreshToken,
    resendVerificationOTP,
    deleteUser,
    loginAdmin
};