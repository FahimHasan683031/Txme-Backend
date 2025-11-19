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

export const providerController = {
  getProviderCalendar,
}