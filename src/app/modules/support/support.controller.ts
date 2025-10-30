import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SupportService } from './support.service';

const makeSupport = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
    const result = await SupportService.makeSupportInDB(req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Support Submitted",
        data: result
    })
});

const supports = catchAsync( async (req: Request, res: Response, next: NextFunction) => {
    const result = await SupportService.supportsFromDB(req.query);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Support List Retrieved',
        data: result
    })
});

export const  SupportController = {
    makeSupport,
    supports
}