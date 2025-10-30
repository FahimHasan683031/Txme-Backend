import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { supportZodValidationSchema } from './support.validation';
import { SupportController } from './support.controller';
const router = express.Router();

router.route('/')
    .post(
        auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR),
        async (req: Request, res: Response, next: NextFunction) => {
            try {

                req.body = { user: req.user.id, ...req.body };
                next();

            } catch (error) {
                res.status(500).json({ message: "Failed to submitted" });
            }
        },
        validateRequest(supportZodValidationSchema),
        SupportController.makeSupport
    )
    .get(
        auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
        SupportController.supports
    )

export const SupportRoutes = router;