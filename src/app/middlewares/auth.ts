import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../config";
import { jwtHelper } from "../../helpers/jwtHelper";
import ApiError from "../../errors/ApiErrors";
import { ADMIN_ROLES, USER_ROLES } from "../../enums/user";
import { User } from "../modules/user/user.model";
import { Admin } from "../modules/admin/admin.model";

const auth =
  (...roles: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tokenWithBearer = req.headers.authorization;

        if (!tokenWithBearer) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Token not found!");
        }

        if (tokenWithBearer && tokenWithBearer.startsWith("Bearer")) {
          const token = tokenWithBearer.split(" ")[1];

          try {
            // Verify token
            const verifyUser = jwtHelper.verifyToken(
              token,
              config.jwt.jwt_secret as Secret
            );

            // Set user to header
            req.user = verifyUser;


            let isExistUser;

            if (verifyUser.role === ADMIN_ROLES.SUPER_ADMIN || verifyUser.role === ADMIN_ROLES.ADMIN) {
              isExistUser = await Admin.findOne({ _id: verifyUser.id });
            } else {
              isExistUser = await User.findOne({ _id: verifyUser.id });
            }



            // Check if user exists
            if (!isExistUser) {
              throw new ApiError(
                StatusCodes.NOT_FOUND,
                "User not found"
              );
            }

            // Check if user is active
            const onboardingRoutes = [
              '/api/v1/auth/send-phone-otp',
              '/api/v1/kyc/didit-session',
              '/api/v1/auth/complete-profile',
              '/api/v1/user/me',
              '/api/v1/user/my-profile'
            ];

            if (isExistUser.status !== 'active') {
              // Allow 'pending' users for specific onboarding routes
              // Also allow GET /api/v1/user/:id for profile viewing during onboarding
              const isUserPath = req.baseUrl + req.path;
              const isSingleUserGet = isUserPath.startsWith('/api/v1/user/') && req.method === 'GET';

              const currentPath = (req.baseUrl + req.path).replace(/\/$/, "");

              const isPendingOnboarding =
                isExistUser.status === 'pending' &&
                (onboardingRoutes.includes(currentPath) || isSingleUserGet);

              if (!isPendingOnboarding) {
                const statusMessages: Record<string, string> = {
                  'pending': 'Your account is pending verification. Please complete your profile and verification.',
                  'rejected': 'Your account has been rejected. Please contact support for more information.',
                  'suspended': 'Your account has been suspended. Please contact support.',
                  'blocked': 'Your account has been blocked. Please contact support.',
                  'deleted': 'Your account has been deleted.'
                };

                const message = isExistUser.status
                  ? statusMessages[isExistUser.status] || 'Your account is not active.'
                  : 'Your account is not active.';

                throw new ApiError(
                  StatusCodes.FORBIDDEN,
                  message
                );
              }
            }


            // Guard user role
            if (roles.length && !roles.includes(verifyUser.role)) {
              throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You don't have permission to access this API"
              );
            }

            next();
          } catch (error) {
            if (error instanceof Error && error.name === "TokenExpiredError") {
              throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                "Access Token has expired"
              );
            }
            next(error);
          }
        }
      } catch (error) {
        next(error);
      }
    };

export default auth;
