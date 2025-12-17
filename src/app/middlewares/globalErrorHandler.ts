import { ErrorRequestHandler } from "express";
import config from "../../config";
import ApiError from "../../errors/ApiErrors";
import handleValidationError from "../../errors/handleValidationError";
import handleZodError from "../../errors/handleZodError";
import { errorLogger } from "../../shared/logger";
import { IErrorMessage } from "../../types/errors.types";
import { StatusCodes } from "http-status-codes";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (config.node_env === "development") {
    try {
      console.error(
        "Inside Global Error Handler🪐:",
        JSON.stringify(
          {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            ...error,
          },
          Object.getOwnPropertyNames(error),
          2
        )
      );
    } catch {
      console.error("Inside Global Error Handler🪐:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });
    }
  } else {
    console.error("🚨 ERROR:", error?.message);
  }

  let statusCode = 500;
  let message = "Something went wrong";
  let errorMessages: IErrorMessage[] = [];

  if (error.name === "ZodError") {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error.name === "ValidationError") {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error.name === "TokenExpiredError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Session Expired";
    errorMessages = error?.message
      ? [
          {
            path: "",
            message:
              "Your session has expired. Please log in again to continue.",
          },
        ]
      : [];
  } else if (error.name === "JsonWebTokenError") {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = "Invalid Token";
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: "Your token is invalid. Please log in again to continue.",
          },
        ]
      : [];
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = error.message
      ? [
          {
            path: "",
            message: error.message,
          },
        ]
      : [];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = error.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.node_env !== "production" ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
