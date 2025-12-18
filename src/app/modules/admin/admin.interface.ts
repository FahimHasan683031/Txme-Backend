import { Model, Types } from "mongoose";
import { ADMIN_ROLES } from "../../../enums/user";

export type IVerifyEmail = {
  email: string;
  oneTimeCode: number;
};

export type ILoginData = {
  email: string;
  password: string;
};

export type IAuthResetPassword = {
  newPassword: string;
  confirmPassword: string;
};

export type IChangePassword = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export interface IAdmin {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: ADMIN_ROLES;
  status: "active" | "inactive" | "delete";
  verified: boolean;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}


export type AdminModel = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IAdmin>;
