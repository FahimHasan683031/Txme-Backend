import { Model } from "mongoose";
import { USER_ROLES } from "../../../enums/user";

interface IAuthenticationProps {
  purpose:
  | "email_verify"
  | "phone_verify"
  | "login_otp"
  | "password_reset"
  | "number_change"
  | "biometric_enable";
  channel: "email" | "phone";
  oneTimeCode: number;
  expireAt: Date;

}

import { IProviderLanguage } from "../../../enums/languages";

interface IWorkingHours {
  startTime: string;
  endTime: string;
  duration: number; // in hours (e.g., 1, 1.5, 2)
}

interface IProviderProfile {
  serviceCategory: string[];
  workingHours: IWorkingHours;
  workingDays: ("Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday")[];
  unavailableDates?: Date[];
  hourlyRate?: number;
  certifications?: string[];
  bio?: string;
  experience?: number;
  skills?: string[];
  languages?: IProviderLanguage[];
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
  review: {
    averageRating: number;
    totalReviews: number;
  };
  authentication?: IAuthenticationProps;
  idDocuments?: string[];
  addressDocuments?: string[];
  biometricEnabled?: boolean;
  status?: "pending" | "active" | "rejected" | "suspended" | "blocked" | "deleted";
  providerProfile?: IProviderProfile;
}

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;