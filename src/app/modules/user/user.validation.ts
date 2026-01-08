// src/modules/auth/auth.validation.ts
import { z } from "zod";
import { USER_ROLES } from "../../../enums/user";
import { PROVIDER_LANGUAGES } from "../../../enums/languages";

// Add status enum for validation
export const USER_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
  BLOCKED: "blocked",
  DELETED: "deleted"
} as const;

// login validation
export const loginZod = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

// Send OTP to email
export const sendEmailOtpZod = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum([USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER]),
  }),
});

// Send OTP to phone
export const sendPhoneOtpZod = z.object({
  body: z.object({
    phone: z.string(),
  }),
});

// Send OTP for password reset
export const sendPasswordResetOtpZod = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

// Send OTP for number change
export const sendNumberChangeOtpZod = z.object({
  body: z.object({
    oldPhone: z.string(),
    newPhone: z.string(),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    identifier: z.string()
      .min(1, "identifier number is required")
      .refine((value) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isPhone = /^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''));
        return isEmail || isPhone;
      }, "Please provide a valid email or phone number"),
  }),
});

// Common OTP verification
export const verifyOtpZod = z.object({
  body: z.object({
    purpose: z.enum([
      "email_verify",
      "phone_verify",
      "login_otp",
      "password_reset",
      "number_change",
      "biometric_enable",
    ]),
    channel: z.enum(["email", "phone"]),
    identifier: z.string(),
    oneTimeCode: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  }),
});

export const completeProfileZod = z.object({
  body: z.object({
    idDocuments: z.array(z.string()).optional(),
    addressDocuments: z.array(z.string()).optional(),
    fullName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    countryOfResidence: z.string().optional(),
    profilePicture: z.string().optional(),
    residentialAddress: z.object({
      address: z.string().min(1, "Address is required"),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
    postalAddress: z.string().optional(),
    identification: z
      .object({
        type: z.enum(["nid", "passport"]),
        value: z.string().min(1, "Identification value is required"),
      })
      .optional(),
    maritalStatus: z.string().optional(),
    status: z.enum([
      "pending",
      "active",
      "rejected",
      "suspended",
      "blocked",
      "deleted"
    ]).optional(),
    bio: z.string().optional(),
    // ✅ Provider profile validation added here
    providerProfile: z.object({
      serviceCategory: z.array(z.string()).optional(),
      designation: z.string().optional(),
      workingHours: z.object({
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
        duration: z.number().positive("Duration must be positive").optional(), // in hours (e.g., 1, 1.5, 2)
      }),
      workingDays: z.array(z.enum(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])).optional(),
      unavailableDates: z.array(z.string()).optional(), // Receiving as strings (ISO dates) from frontend usually
      hourlyRate: z.number().positive("Hourly rate must be positive").optional(),
      certifications: z.array(z.string()).optional(),
      experience: z.number().min(0, "Experience cannot be negative").optional(),
      skills: z.array(z.string()).optional(),
      languages: z.array(z.enum(PROVIDER_LANGUAGES as unknown as [string, ...string[]])).optional(),
    }).optional(),
  }).strict(),
});

// ✅ New schema for updating user status (admin only)
export const updateUserStatusZodSchema = z.object({
  params: z.object({
    userId: z.string({ required_error: 'User ID is required' }),
  }),
  body: z.object({
    status: z.enum([
      "pending",
      "active",
      "rejected",
      "suspended",
      "blocked",
      "deleted"
    ]),
  }),
});



export const resendOtpZod = z.object({
  body: z.object({
    identifier: z.string()
      .min(1, "Email or phone number is required")
      .refine((value) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isPhone = /^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''));
        return isEmail || isPhone;
      }, "Please provide a valid email or phone number"),
  })
});

export const userIdParamZodSchema = z.object({
  params: z.object({
    userId: z.string({ required_error: 'User ID is required' }),
  }),
});
