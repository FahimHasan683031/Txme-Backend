import { Model } from "mongoose";
import { USER_ROLES } from "../../../enums/user";

interface IAuthenticationProps {
  purpose:
    | "email_verify"
    | "phone_verify"
    | "login_otp"
    | "password_reset"
    | "number_change";
  channel: "email" | "phone";
  oneTimeCode: number;
  expireAt: Date;
}

export interface IUser extends Document {
  email: {
    value: string;
    isVerified: boolean;
  };
  phone?: {
    value: string;
    isVerified: boolean;
  };
  fullName?: string;
  dateOfBirth?: Date;
  role?: USER_ROLES;
  gender?: string;
  nationality?: string;
  profilePicture?: string;
  countryOfResidence?: string;
  residentialAddress?: string;
  postalAddress?: string;
  identification?: {
    type: "nid" | "passport";
    value: string;
  };
  maritalStatus?: string;
  authentication?: IAuthenticationProps;
}

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
