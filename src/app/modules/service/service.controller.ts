import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import { serviceService } from "./service.service";
import { IService } from "./service.interface";
import { StatusCodes } from "http-status-codes";

// create service
const createService = async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await serviceService.createService(payload);
  sendResponse<IService>(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Service created successfully",
    data: result,
  });
};

// get all services
const getAllServices = async (req: Request, res: Response) => {
  const result = await serviceService.getAllServices(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Services retrieved successfully",
    data: result,
  });
};

// update service
const updateService = async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const result = await serviceService.updateService(id, payload);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service updated successfully",
    data: result,
  });
};


// delete service
const deleteService = async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await serviceService.deleteService(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Service deleted successfully",
    data: result,
  });
};

// get all child services
const getAllChildServices = async (req: Request, res: Response) => {
  const result = await serviceService.getAllChildServices();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Child services retrieved successfully",
    data: result,
  });
};

export const serviceController = {
  createService,
  getAllServices,
  updateService,
  deleteService,
  getAllChildServices,
};
