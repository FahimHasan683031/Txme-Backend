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

interface IWorkingHours {
  startTime: string;
  endTime: string;
  duration: number;
  workingDays: string[];
}

interface IProviderProfile {
  serviceCategory: string[];
  workingHours: IWorkingHours;
  pricePerSlot: number;
  certifications?: string[];
  bio?: string;
  experience?: number;
  skills?: string[];
}

export interface IUser extends Document {
  email: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: Date;
  role?: USER_ROLES;
  gender?: string;
  nationality?: string;
  profilePicture?: string;
  countryOfResidence?: string;
  residentialAddress?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  postalAddress?: string;
  identification?: {
    type: "nid" | "passport";
    value: string;
  };
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  maritalStatus?: string;
  authentication?: IAuthenticationProps;
  idDocuments?: string[];
  addressDocuments?: string[];
  status?: "pending" | "active" | "rejected" | "suspended" | "blocked" | "deleted";
  providerProfile?: IProviderProfile;
}

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;