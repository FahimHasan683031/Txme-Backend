import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { MessageController } from './message.controller';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { ADMIN_ROLES } from '../../../enums/user';

const router = express.Router();

// Send a message
router.post('/',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  fileUploadHandler(),
  async (req, res, next) => {
    try {
      const image = getSingleFilePath(req.files, "image");
      req.body = {
        sender: req.user.id,
        image,
        ...req.body
      };
      next();
    } catch (error) {
      res.status(400).json({ message: "Failed to upload message image" });
    }
  },
  MessageController.sendMessage
);

// Get messages for a chat
router.get(
  '/:id',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  MessageController.getMessage
);

// Mark messages as read
router.patch(
  '/mark-read/:chatId',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  MessageController.markAsRead
);

// Get total unread count
router.get(
  '/unread/count',
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  MessageController.getUnreadCount
);

export const MessageRoutes = router;
