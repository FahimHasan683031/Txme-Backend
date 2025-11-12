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
      value: { type: String, required: true, unique: true },
      isVerified: { type: Boolean },
    },
    phone: {
      value: { type: String, required: false, unique: true, sparse: true },
      isVerified: { type: Boolean },
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
    maritalStatus: { type: String },
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
userSchema.index({ "email.value": 1 }, { unique: true });
userSchema.index({ "phone.value": 1 }, { unique: true, sparse: true });

// ✅ Keep your existing statics & pre hook as-is

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ "email.value": email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre("save", async function (next) {
  const emailValue = this?.email?.value;
  
  if (emailValue) {
    const existingUser = await User.findOne({
      "email.value": emailValue,
      _id: { $ne: this._id },
    });
console.log("emailValue", emailValue);
    if (existingUser) {
      return next(
        new ApiError(StatusCodes.BAD_REQUEST, "Email already exist!")
      );
    }
  }
  next();
});

export const User = model<IUser, UserModal>("User", userSchema);
