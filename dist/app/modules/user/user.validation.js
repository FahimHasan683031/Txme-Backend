"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdParamZodSchema = exports.resendOtpZod = exports.updateUserStatusZodSchema = exports.completeProfileZod = exports.verifyOtpZod = exports.resendOtpSchema = exports.sendNumberChangeOtpZod = exports.sendPasswordResetOtpZod = exports.sendPhoneOtpZod = exports.sendEmailOtpZod = exports.loginZod = exports.USER_STATUS = void 0;
// src/modules/auth/auth.validation.ts
const zod_1 = require("zod");
const user_1 = require("../../../enums/user");
const languages_1 = require("../../../enums/languages");
// Add status enum for validation
exports.USER_STATUS = {
    PENDING: "pending",
    ACTIVE: "active",
    REJECTED: "rejected",
    SUSPENDED: "suspended",
    BLOCKED: "blocked",
    DELETED: "deleted"
};
// login validation
exports.loginZod = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
    }),
});
// Send OTP to email
exports.sendEmailOtpZod = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        role: zod_1.z.enum([user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER]),
    }),
});
// Send OTP to phone
exports.sendPhoneOtpZod = zod_1.z.object({
    body: zod_1.z.object({
        phone: zod_1.z.string(),
        id: zod_1.z.string(),
    }),
});
// Send OTP for password reset
exports.sendPasswordResetOtpZod = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
    }),
});
// Send OTP for number change
exports.sendNumberChangeOtpZod = zod_1.z.object({
    body: zod_1.z.object({
        oldPhone: zod_1.z.string(),
        newPhone: zod_1.z.string(),
    }),
});
exports.resendOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z.string()
            .min(1, "identifier number is required")
            .refine((value) => {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            const isPhone = /^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''));
            return isEmail || isPhone;
        }, "Please provide a valid email or phone number"),
    }),
});
// Common OTP verification
exports.verifyOtpZod = zod_1.z.object({
    body: zod_1.z.object({
        purpose: zod_1.z.enum([
            "email_verify",
            "phone_verify",
            "login_otp",
            "password_reset",
            "number_change",
            "biometric_enable",
        ]),
        channel: zod_1.z.enum(["email", "phone"]),
        identifier: zod_1.z.string(),
        oneTimeCode: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform((v) => Number(v)),
    }),
});
exports.completeProfileZod = zod_1.z.object({
    body: zod_1.z.object({
        idDocuments: zod_1.z.array(zod_1.z.string()).optional(),
        addressDocuments: zod_1.z.array(zod_1.z.string()).optional(),
        fullName: zod_1.z.string().optional(),
        dateOfBirth: zod_1.z.string().optional(),
        gender: zod_1.z.string().optional(),
        nationality: zod_1.z.string().optional(),
        countryOfResidence: zod_1.z.string().optional(),
        profilePicture: zod_1.z.string().optional(),
        residentialAddress: zod_1.z.object({
            address: zod_1.z.string().min(1, "Address is required"),
            latitude: zod_1.z.number().min(-90).max(90),
            longitude: zod_1.z.number().min(-180).max(180),
        }).optional(),
        postalAddress: zod_1.z.string().optional(),
        identification: zod_1.z
            .object({
            type: zod_1.z.enum(["nid", "passport"]),
            value: zod_1.z.string().min(1, "Identification value is required"),
        })
            .optional(),
        maritalStatus: zod_1.z.string().optional(),
        status: zod_1.z.enum([
            "pending",
            "active",
            "rejected",
            "suspended",
            "blocked",
            "deleted"
        ]).optional(),
        bio: zod_1.z.string().optional(),
        // ✅ Provider profile validation added here
        providerProfile: zod_1.z.object({
            serviceCategory: zod_1.z.array(zod_1.z.string()).optional(),
            designation: zod_1.z.string().optional(),
            workingHours: zod_1.z.object({
                startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
                endTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
                duration: zod_1.z.number().positive("Duration must be positive").optional(), // in hours (e.g., 1, 1.5, 2)
            }),
            workingDays: zod_1.z.array(zod_1.z.enum(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])).optional(),
            unavailableDates: zod_1.z.array(zod_1.z.string()).optional(), // Receiving as strings (ISO dates) from frontend usually
            hourlyRate: zod_1.z.number().positive("Hourly rate must be positive").optional(),
            certifications: zod_1.z.array(zod_1.z.string()).optional(),
            experience: zod_1.z.number().min(0, "Experience cannot be negative").optional(),
            skills: zod_1.z.array(zod_1.z.string()).optional(),
            languages: zod_1.z.array(zod_1.z.enum(languages_1.PROVIDER_LANGUAGES)).optional(),
        }).optional(),
    }).strict(),
});
// ✅ New schema for updating user status (admin only)
exports.updateUserStatusZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({ required_error: 'User ID is required' }),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum([
            "pending",
            "active",
            "rejected",
            "suspended",
            "blocked",
            "deleted"
        ]),
    }),
});
exports.resendOtpZod = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z.string()
            .min(1, "Email or phone number is required")
            .refine((value) => {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            const isPhone = /^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''));
            return isEmail || isPhone;
        }, "Please provide a valid email or phone number"),
    })
});
exports.userIdParamZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string({ required_error: 'User ID is required' }),
    }),
});
