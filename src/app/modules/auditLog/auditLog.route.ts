import express from 'express';
import { ADMIN_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { AuditLogController } from './auditLog.controller';

const router = express.Router();

router.get(
    '/',
    auth(ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN),
    AuditLogController.getAuditLogs
);

export const AuditLogRoutes = router;
