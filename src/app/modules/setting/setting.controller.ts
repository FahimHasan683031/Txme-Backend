import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SettingService } from './setting.service';

const getSetting = catchAsync(async (req: Request, res: Response) => {
    const result = await SettingService.getSetting();
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Settings retrieved successfully',
        data: result
    });
});

const updateSetting = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const result = await SettingService.updateSetting(req.body, userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Settings updated successfully',
        data: result
    });
});

export const SettingController = {
    getSetting,
    updateSetting
};
