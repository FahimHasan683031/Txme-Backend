import { model, Schema } from "mongoose";
import { USER_ROLES } from "../../../enums/user";
import { IUser, UserModal } from "./user.interface";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";
import { Wallet } from "../wallet/wallet.model";



import { PROVIDER_LANGUAGES } from "../../../enums/languages";

// Provider Profile Sub-document Schema
const providerProfileSchema = new Schema(
  {
    serviceCategory: {
      type: [String],
      required: true,
    },
    designation: { type: String },
    workingHours: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      duration: { type: Number, required: true, default: 2 }, // duration in hours (e.g., 1, 1.5, 2)
    },
    workingDays: [
      {
        type: String, // e.g., "Monday", "Tuesday"
        required: true,
        enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      },
    ],
    unavailableDates: [
      {
        type: Date,
      }
    ],
    hourlyRate: { type: Number, required: true },
    certifications: [{ type: String }],
    experience: { type: Number },
    skills: [{ type: String }],
    languages: [{
      type: String,
      enum: PROVIDER_LANGUAGES,
    }],
  },
  { _id: false, timestamps: false }
);

// Main User Schema
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    fullName: { type: String },
    dateOfBirth: { type: Date },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: false,
    },
    gender: { type: String },
    nationality: { type: String },
    countryOfResidence: { type: String },
    profilePicture: { type: String },
    residentialAddress: {
      address: { type: String, required: false },
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false },
    },
    postalAddress: { type: String },
    identification: {
      type: {
        type: String,
        enum: ["nid", "passport"],
        required: false,
      },
      value: { type: String, required: false },
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    maritalStatus: { type: String },
    biometricEnabled: {
      type: Boolean,
      default: false,
    },
    idDocuments: [
      {
        type: String,
        required: false,
      },
    ],
    addressDocuments: [
      {
        type: String,
        required: false,
      },
    ],
    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "rejected",
        "suspended",
        "blocked",
        "deleted",
      ],
      default: "pending",
    },

    providerProfile: {
      type: providerProfileSchema,
      required: false
    },
    review: {
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    bio: { type: String },

    authentication: {
      purpose: {
        type: String,
        enum: [
          "email_verify",
          "phone_verify",
          "login_otp",
          "password_reset",
          "number_change",
          "biometric_enable",
        ],
      },
      channel: {
        type: String,
        enum: ["email", "phone"],
      },
      oneTimeCode: { type: Number },
      expireAt: { type: Date },
    },
    stripeAccountId: { type: String, required: false },
    isStripeConnected: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// pre save hook
userSchema.pre("save", async function (next) {
  next();
});

userSchema.pre("save", function (next) {
  if (this.providerProfile) {
    const profile = this.providerProfile;

    if (!profile.serviceCategory || profile.serviceCategory.length === 0) {
      return next(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          "At least one service category is required for providers"
        )
      );
    }

    if (
      !profile.workingHours?.startTime ||
      !profile.workingHours?.endTime ||
      !profile.workingHours?.duration ||
      !profile.workingDays?.length
    ) {
      return next(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          "Complete working hours information is required for providers"
        )
      );
    }

    if (!profile.hourlyRate) {
      return next(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          "Hourly rate is required for providers"
        )
      );
    }
  }
  next();
});


// ✅ Index for residentialAddress coordinates (2dsphere for radius search)
userSchema.index({
  "residentialAddress.latitude": 1,
  "residentialAddress.longitude": 1,
});

// ✅ Index for provider profile searches
userSchema.index({
  "providerProfile.serviceCategory": 1,
});

// ALL OTHER STATICS AND HOOKS REMAIN EXACTLY SAME
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email: email });
  return isExist;
};

userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

userSchema.pre("save", async function (next) {
  if (this.isNew) {
    const email = this.email;

    if (email) {
      const existingUser = await User.findOne({
        email: email,
      });

      if (existingUser) {
        return next(
          new ApiError(StatusCodes.BAD_REQUEST, "Email already exists!")
        );
      }
    }
  }
  next();
});

export const User = model<IUser, UserModal>("User", userSchema);
