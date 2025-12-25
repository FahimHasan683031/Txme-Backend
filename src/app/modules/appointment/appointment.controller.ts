// src/modules/Appointment/Appointment.controller.ts
import { Request, Response } from "express";
import { AppointmentService } from "./appointment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";


const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const Appointment = await AppointmentService.createAppointment(req.user.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Appointment created successfully',
    data: Appointment,
  });
});

const payWithWallet = catchAsync(async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  const userId = req.user.id; // Assuming user.id is available in req.user

  const result = await AppointmentService.payWithWallet(appointmentId, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Appointment paid with wallet successfully',
    data: result,
  });
});

const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentService.getMyAppointments(req.user, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointments retrieved successfully",
    data: result,
  });
});

const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentService.getAllAppointmentsFromDB(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All appointments retrieved successfully",
    data: result,
  });
});

const updateAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
  const { appointmentId } = req.params;
  const { status, ...data } = req.body;
  const { id: userId, role: userRole } = req.user;

  const result = await AppointmentService.updateAppointmentStatus(
    appointmentId,
    status,
    userId,
    userRole,
    data
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Appointment status updated successfully",
    data: result,
  });
});

export const AppointmentController = {
  createAppointment,
  payWithWallet,
  getMyAppointments,
  getAllAppointments,
  updateAppointmentStatus
}