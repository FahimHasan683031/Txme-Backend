import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../config';
import { jwtHelper } from '../../helpers/jwtHelper';
import ApiError from '../../errors/ApiErrors';
import { USER_ROLES } from '../../enums/user';
import { Subscription } from '../modules/subscription/subscription.model';
import stripe from '../../config/stripe';
import { User } from '../modules/user/user.model';

const auth = (...roles: string[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tokenWithBearer = req.headers.authorization;
        if (!tokenWithBearer) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
        }

        if (tokenWithBearer && tokenWithBearer.startsWith('Bearer')) {
            const token = tokenWithBearer.split(' ')[1];

            //verify token
            const verifyUser = jwtHelper.verifyToken(
                token,
                config.jwt.jwt_secret as Secret
            );

            //set user to header
            req.user = verifyUser as JwtPayload;

            //guard user
            if (roles.length && !roles.includes(verifyUser.role)) {
                throw new ApiError(StatusCodes.FORBIDDEN, "You don't have permission to access this api");
            }
            next();
        }
    } catch (error) {
        next(error);
    }
}
export default auth;