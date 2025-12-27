import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES, ADMIN_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
const router = express.Router();

router.get('/',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    NotificationController.getNotificationFromDB
);

router.get('/admin',
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    NotificationController.adminNotificationFromDB
);

router.get('/unread-count',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    NotificationController.getUnreadCount
);

router.get('/admin/unread-count',
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    NotificationController.adminGetUnreadCount
);

export const NotificationRoutes = router;
