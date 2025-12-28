"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const chat_controller_1 = require("./chat.controller");
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
// Create a regular chat between users
router.post("/", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), async (req, res, next) => {
    try {
        req.body = {
            participants: [req.user.id, req.body.participant],
            isAdminSupport: false
        };
        next();
    }
    catch (error) {
        res.status(400).json({ message: "Failed to create chat" });
    }
}, chat_controller_1.ChatController.createChat);
// Create admin support chat
router.post("/admin-support", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), chat_controller_1.ChatController.createAdminSupport);
// Get all chats for current user
router.get("/", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), chat_controller_1.ChatController.getChat);
// Get all admin support chats (admin only)
router.get("/admin-support/all", (0, auth_1.default)(user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), chat_controller_1.ChatController.getAdminSupportChats);
// Delete a chat
router.delete("/:id", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), chat_controller_1.ChatController.deleteChat);
exports.ChatRoutes = router;
