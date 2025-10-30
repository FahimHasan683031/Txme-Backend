import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RuleService } from './rule.service';

const createPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await RuleService.createPrivacyPolicyToDB(req.body)
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Privacy policy created successfully',
        data: result
    })
})

const getPrivacyPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await RuleService.getPrivacyPolicyFromDB()
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Privacy policy retrieved successfully',
        data: result
    })
})

const createTermsAndCondition = catchAsync( async (req: Request, res: Response) => {
    const result = await RuleService.createTermsAndConditionToDB(req.body)
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Terms and conditions created successfully',
        data: result
    })
})
  
const getTermsAndCondition = catchAsync(async (req: Request, res: Response) => {
    const result = await RuleService.getTermsAndConditionFromDB()
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Terms and conditions retrieved successfully',
        data: result
    })
})

const createAbout = catchAsync(async (req: Request, res: Response) => {
    const result = await RuleService.createAboutToDB(req.body)
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'About created successfully',
        data: result
    })
})
  
const getAbout = catchAsync(async (req: Request, res: Response) => {
    const result = await RuleService.getAboutFromDB()
  
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'About retrieved successfully',
        data: result
    })
})

export const RuleController = {
    createPrivacyPolicy,
    getPrivacyPolicy,
    createTermsAndCondition,
    getTermsAndCondition,
    createAbout,
    getAbout
}  