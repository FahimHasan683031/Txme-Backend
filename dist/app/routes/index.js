"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("../modules/user/user.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const rule_route_1 = require("../modules/rule/rule.route");
const chat_routes_1 = require("../modules/chat/chat.routes");
const message_routes_1 = require("../modules/message/message.routes");
const notification_routes_1 = require("../modules/notification/notification.routes");
const support_routes_1 = require("../modules/support/support.routes");
const service_route_1 = require("../modules/service/service.route");
const provider_route_1 = require("../modules/provider/provider.route");
const appointment_route_1 = require("../modules/appointment/appointment.route");
const admin_route_1 = require("../modules/admin/admin.route");
const review_route_1 = require("../modules/review/review.route");
const wallet_route_1 = require("../modules/wallet/wallet.route");
const setting_route_1 = require("../modules/setting/setting.route");
const auditLog_route_1 = require("../modules/auditLog/auditLog.route");
const transaction_route_1 = require("../modules/transaction/transaction.route");
const stripe_route_1 = require("../modules/stripe/stripe.route");
const router = express_1.default.Router();
const apiRoutes = [
    { path: "/user", route: user_routes_1.UserRoutes },
    { path: "/auth", route: auth_routes_1.AuthRoutes },
    { path: "/service", route: service_route_1.ServiceRoutes },
    { path: "/rule", route: rule_route_1.RuleRoutes },
    { path: "/chat", route: chat_routes_1.ChatRoutes },
    { path: "/message", route: message_routes_1.MessageRoutes },
    { path: "/notification", route: notification_routes_1.NotificationRoutes },
    { path: "/support", route: support_routes_1.SupportRoutes },
    { path: "/provider", route: provider_route_1.providerRoute },
    { path: "/appointment", route: appointment_route_1.AppointmentRoutes },
    { path: "/admin", route: admin_route_1.AdminRoutes },
    { path: "/review", route: review_route_1.ReviewRoutes },
    { path: "/wallet", route: wallet_route_1.WalletRoutes },
    { path: "/setting", route: setting_route_1.SettingRoutes },
    { path: "/audit-log", route: auditLog_route_1.AuditLogRoutes },
    { path: "/transaction", route: transaction_route_1.TransactionRoutes },
    { path: "/stripe", route: stripe_route_1.StripeRoutes },
];
apiRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
