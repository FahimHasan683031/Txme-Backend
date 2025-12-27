import { Request, Response } from "express";
import { proveiderServices } from "./provider.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";


const getProviderCalendar = catchAsync(async (req: Request, res: Response) => {
  const calendar = await proveiderServices.getProviderCalendar(
    req.params.providerId,
    req.query.date as string
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Provider Calendar Retrieve Successfully',
    data: calendar,
  });
});

// get popular providers
const getPopularProviders = catchAsync(async (req: Request, res: Response) => {
  const result = await proveiderServices.getPopularProvidersFromDB(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Popular providers retrieved successfully',
    data: result
  });
});

export const providerController = {
  getProviderCalendar,
  getPopularProviders
}