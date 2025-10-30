import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { AuthController } from './auth.controller';
const router = express.Router();

router.post('/login',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { phone, countryCode } = req.body;

            req.body = { phone: `${countryCode}` + `${phone}` };
            next();

        } catch (error) {
            res.status(500).json({ message: "Failed to convert string to number" });
        }
    },
    AuthController.loginUser
);

router.post('/admin-login',
    AuthController.loginAdmin
);

router.post('/verify-phone',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { phone, oneTimeCode } = req.body;

            req.body = { phone, oneTimeCode: Number(oneTimeCode) };
            next();

        } catch (error) {
            res.status(500).json({ message: "Failed to convert string to number" });
        }
    },
    AuthController.verifyPhone
);

router.post(
    '/refresh-token',
    AuthController.refreshToken
);

router.post(
    '/resend-otp',
    AuthController.resendVerificationOTP
);

router.delete(
    '/delete-account',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR),
    AuthController.deleteUser
);

export const AuthRoutes = router;