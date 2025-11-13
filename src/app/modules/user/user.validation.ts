// src/modules/auth/auth.validation.ts
import { z } from "zod";
import { USER_ROLES } from "../../../enums/user";

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
    role: z.enum([USER_ROLES.ADMIN, USER_ROLES.CUSTOMER,USER_ROLES.VENDOR,USER_ROLES.GUEST]),
  }),
});

// Send OTP to phone
export const sendPhoneOtpZod = z.object({
  body: z.object({
    phone: z.string(),
    id: z.string(),
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
    ]),
    channel: z.enum(["email", "phone"]),
    identifier: z.string(), // email or phone
    oneTimeCode: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  }),
});

export const completeProfileZod = z.object({
  body: z.object({
    idDocuments: z.array(z.string()).optional(),
    addressDocuments: z.array(z.string()).optional(),
    fullName: z.string().optional(),
    dateOfBirth: z.string().optional(), // send as ISO string
    gender: z.string().optional(),
    nationality: z.string().optional(),
    countryOfResidence: z.string().optional(),
    profilePicture: z.string().optional(),
    residentialAddress: z.string().optional(),
    postalAddress: z.string().optional(),
    identification: z
      .object({
        type: z.enum(["nid", "passport"]),
        value: z.string(),
      })
      .optional(),
    maritalStatus: z.string().optional(),
  }).strict(), 
});
