"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auditLog_controller_1 = require("./auditLog.controller");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(user_1.ADMIN_ROLES.SUPER_ADMIN, user_1.ADMIN_ROLES.ADMIN), auditLog_controller_1.AuditLogController.getAuditLogs);
exports.AuditLogRoutes = router;
