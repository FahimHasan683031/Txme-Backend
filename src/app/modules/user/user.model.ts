import { model, Schema } from "mongoose";
import { USER_ROLES } from "../../../enums/user";
import { IUser, UserModal } from "./user.interface";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";

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
    residentialAddress: { type: String },
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
    idDocuments: [
      {
        type: String,
        required: false,
      }
    ],
    addressDocuments: [
      {
        type: String,
        required: false,
      }
    ],
    authentication: {
      purpose: {
        type: String,
        enum: [
          "email_verify",
          "phone_verify",
          "login_otp",
          "password_reset",
          "number_change",
        ],
      },
      channel: {
        type: String,
        enum: ["email", "phone"],
      },
      oneTimeCode: { type: Number },
      expireAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Explicit indexes for reliability
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

// ✅ Keep your existing statics & pre hook as-is

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email: email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check duplicate email before saving - ONLY FOR NEW USERS
userSchema.pre("save", async function (next) {
  // Only check for duplicates when creating a NEW user
  if (this.isNew) {
    const email = this.email;
    
    if (email) {
      const existingUser = await User.findOne({
        email: email
      });
      console.log("existingUser", existingUser);
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