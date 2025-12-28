"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const message_controller_1 = require("./message.controller");
const user_2 = require("../../../enums/user");
const processReqBody_1 = require("../../middlewares/processReqBody");
const router = express_1.default.Router();
// Send a message
router.post('/', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_2.ADMIN_ROLES.ADMIN, user_2.ADMIN_ROLES.SUPER_ADMIN), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), message_controller_1.MessageController.sendMessage);
// Get messages for a chat
router.get('/:id', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_2.ADMIN_ROLES.ADMIN, user_2.ADMIN_ROLES.SUPER_ADMIN), message_controller_1.MessageController.getMessage);
// Update a message
router.patch('/:id', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_2.ADMIN_ROLES.ADMIN, user_2.ADMIN_ROLES.SUPER_ADMIN), message_controller_1.MessageController.updateMessage);
// Get total unread count
router.get('/unread/count', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_2.ADMIN_ROLES.ADMIN, user_2.ADMIN_ROLES.SUPER_ADMIN), message_controller_1.MessageController.getUnreadCount);
// Update money request status (accept/reject)
router.patch('/:messageId/money-request', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), message_controller_1.MessageController.updateMoneyRequestStatus);
// Delete a message
router.delete('/:id', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_2.ADMIN_ROLES.ADMIN, user_2.ADMIN_ROLES.SUPER_ADMIN), message_controller_1.MessageController.deleteMessage);
exports.MessageRoutes = router;
