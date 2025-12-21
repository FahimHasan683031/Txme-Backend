import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from './user.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';


// retrieved user profile
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await UserService.getAllUsers(req.query);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Users data retrieved successfully',
        data: result
    });
});

//update profile
const updateProfile = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserService.updateProfileToDB(req.user, req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Profile updated successfully',
        data: result
    });
});

// get single user
const getSingleUser = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await UserService.getSingleUser(id);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'User retrieved successfully',
        data: result
    });
});

// get my profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const user = req.user;
    const result = await UserService.getmyProfile(user);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Profile data retrieved successfully',
        data: result
    });
});



export const UserController = { 
    getAllUsers, 
    updateProfile,
    getSingleUser,
    getMyProfile
};