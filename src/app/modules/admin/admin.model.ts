import mongoose from "mongoose";
import { ADMIN_ROLES } from "../../../enums/user";
import { AdminModel, IAdmin } from "./admin.interface";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";
import bcrypt from "bcryptjs";

const AdminSchema = new mongoose.Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ADMIN_ROLES,
      default: ADMIN_ROLES.ADMIN,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "delete"],
      default: "active",
    },
    verified: {
      type: Boolean,
      default: true,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: 0,
    },
  },
  {
    timestamps: true,
  }
);

//exist user check
AdminSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await Admin.findById(id);
  return isExist;
};

AdminSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await Admin.findOne({ email });
  return isExist;
};

//is match password
AdminSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//make password secure
AdminSchema.pre("save", async function (next) {
  //check user
  const isExist = await Admin.findOne({ email: this.email });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "A user already exist with this email!");
  }

  //password hash
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

export const Admin = mongoose.model<IAdmin, AdminModel>("Admin", AdminSchema);
