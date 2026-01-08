import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { PromotionService } from "./promotion.service";

const getAllPackages = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.getAllPackages();
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Promotion packages retrieved successfully",
        data: result,
    });
});

const verifyPurchase = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.verifyPurchase(req.user.id, req.body);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Purchase verified and promotion activated successfully",
        data: result,
    });
});

const createPackage = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.createPackageToDB(req.body);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: "Promotion package created successfully",
        data: result,
    });
});

const updatePackage = catchAsync(async (req: Request, res: Response) => {
    const result = await PromotionService.updatePackageToDB(req.params.id, req.body);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Promotion package updated successfully",
        data: result,
    });
});

const deletePackage = catchAsync(async (req: Request, res: Response) => {
    await PromotionService.deletePackageFromDB(req.params.id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Promotion package deleted successfully",
    });
});

export const PromotionController = {
    getAllPackages,
    verifyPurchase,
    createPackage,
    updatePackage,
    deletePackage
};
