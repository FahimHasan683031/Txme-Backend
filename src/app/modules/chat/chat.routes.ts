import express from 'express';
import auth from '../../middlewares/auth';
import { ChatController } from './chat.controller';
import { USER_ROLES, ADMIN_ROLES } from '../../../enums/user';

const router = express.Router();

// Create a regular chat between users
router.post(
  "/",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  async (req, res, next) => {
    try {
      req.body = {
        participants: [req.user.id, req.body.participant],
        isAdminSupport: false
      };
      next();
    } catch (error) {
      res.status(400).json({ message: "Failed to create chat" });
    }
  },
  ChatController.createChat
);

// Create admin support chat
router.post(
  "/admin-support",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  ChatController.createAdminSupport
);

// Get all chats for current user
router.get(
  "/",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  ChatController.getChat
);

// Get all admin support chats (admin only)
router.get(
  "/admin-support/all",
  auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  ChatController.getAdminSupportChats
);

// Delete a chat
router.delete(
  "/:id",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  ChatController.deleteChat
);

export const ChatRoutes = router;
