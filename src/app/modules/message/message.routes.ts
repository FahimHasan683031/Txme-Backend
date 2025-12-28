import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MessageController } from './message.controller';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { ADMIN_ROLES } from '../../../enums/user';
import { fileAndBodyProcessorUsingDiskStorage } from '../../middlewares/processReqBody';

const router = express.Router();

// Send a message
router.post('/',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  fileAndBodyProcessorUsingDiskStorage(),
  MessageController.sendMessage
);

// Get messages for a chat
router.get(
  '/:id',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  MessageController.getMessage
);

// Update a message
router.patch(
  '/:id',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  MessageController.updateMessage
);

// Get total unread count
router.get(
  '/unread/count',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  MessageController.getUnreadCount
);

// Update money request status (accept/reject)
router.patch(
  '/:messageId/money-request',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  MessageController.updateMoneyRequestStatus
);

// Delete a message
router.delete(
  '/:id',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  MessageController.deleteMessage
);

export const MessageRoutes = router;
