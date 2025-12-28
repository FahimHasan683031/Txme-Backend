"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminValidation = void 0;
const zod_1 = require("zod");
const createAdminZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Name is required' }),
        email: zod_1.z.string({ required_error: 'Email is required' }),
        password: zod_1.z.string({ required_error: 'Password is required' })
    }).strict(),
});
const verifyOTPZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }),
        oneTimeCode: zod_1.z.number({ required_error: 'One time code is required' }),
    }).strict(),
});
const loginZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }),
        password: zod_1.z.string({ required_error: 'Password is required' }),
    }).strict(),
});
const forgetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string({ required_error: 'Email is required' }),
    }).strict(),
});
const resetPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        newPassword: zod_1.z.string({ required_error: 'Password is required' }),
        confirmPassword: zod_1.z.string({
            required_error: 'Confirm Password is required',
        }),
    }).strict(),
});
const changePasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string({
            required_error: 'Current Password is required',
        }),
        newPassword: zod_1.z.string({ required_error: 'New Password is required' }),
        confirmPassword: zod_1.z.string({
            required_error: 'Confirm Password is required',
        }),
    }).strict(),
});
const userIdParamZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({ required_error: 'User ID is required' }),
    }),
});
exports.AdminValidation = {
    createAdminZodSchema,
    verifyOTPZodSchema,
    loginZodSchema,
    forgetPasswordZodSchema,
    resetPasswordZodSchema,
    changePasswordZodSchema,
    userIdParamZodSchema,
};
