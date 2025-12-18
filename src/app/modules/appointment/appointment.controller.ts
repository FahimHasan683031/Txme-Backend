// src/modules/Appointment/Appointment.controller.ts
import { Request, Response } from "express";
import { AppointmentService } from "./appointment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";


const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const Appointment = await AppointmentService.createAppointment(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Appointment created successfully',
    data: Appointment,
  });
});

export const AppointmentController = {
  createAppointment,
}