import express from 'express';
import { UserRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { PlanRoutes } from '../modules/plan/plan.routes';
import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';
import { RuleRoutes } from '../modules/rule/rule.route';
import { ChatRoutes } from '../modules/chat/chat.routes';
import { MessageRoutes } from '../modules/message/message.routes';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { SupportRoutes } from '../modules/support/support.routes';
import { ServiceRoutes } from '../modules/service/service.route';
import { providerRoute } from '../modules/provider/provider.route';
import { AppointmentRoutes } from '../modules/appointment/appointment.route';
import { AdminRoutes } from '../modules/admin/admin.route';
import { ReviewRoutes } from '../modules/review/review.route';
import { WalletRoutes } from '../modules/wallet/wallet.route';
const router = express.Router();

const apiRoutes = [
    { path: "/user", route: UserRoutes },
    { path: "/auth", route: AuthRoutes },
    { path: "/service", route: ServiceRoutes },
    { path: "/plan", route: PlanRoutes },
    { path: "/subscription", route: SubscriptionRoutes },
    { path: "/rule", route: RuleRoutes },
    { path: "/chat", route: ChatRoutes },
    { path: "/message", route: MessageRoutes },
    { path: "/notification", route: NotificationRoutes },
    { path: "/support", route: SupportRoutes },
    { path: "/provider", route: providerRoute },
    { path: "/appointment", route: AppointmentRoutes },
    { path: "/admin", route: AdminRoutes },
    { path: "/review", route: ReviewRoutes },
    { path: "/wallet", route: WalletRoutes },
]

apiRoutes.forEach(route => router.use(route.path, route.route));
export default router;