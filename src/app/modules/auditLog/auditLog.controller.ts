import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuditLogService } from './auditLog.service';

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
    const result = await AuditLogService.getLogsFromDB(req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result
    });
});

export const AuditLogController = {
    getAuditLogs
};
