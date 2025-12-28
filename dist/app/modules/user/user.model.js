"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_1 = require("../../../enums/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const languages_1 = require("../../../enums/languages");
// Provider Profile Sub-document Schema
const providerProfileSchema = new mongoose_1.Schema({
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
            enum: languages_1.PROVIDER_LANGUAGES,
        }],
}, { _id: false, timestamps: false });
// Main User Schema
const userSchema = new mongoose_1.Schema({
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
        enum: Object.values(user_1.USER_ROLES),
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
    fcmToken: { type: String, required: false },
}, {
    timestamps: true,
});
// pre save hook
userSchema.pre("save", async function (next) {
    next();
});
userSchema.pre("save", function (next) {
    var _a, _b, _c, _d;
    if (this.providerProfile) {
        const profile = this.providerProfile;
        if (!profile.serviceCategory || profile.serviceCategory.length === 0) {
            return next(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "At least one service category is required for providers"));
        }
        if (!((_a = profile.workingHours) === null || _a === void 0 ? void 0 : _a.startTime) ||
            !((_b = profile.workingHours) === null || _b === void 0 ? void 0 : _b.endTime) ||
            !((_c = profile.workingHours) === null || _c === void 0 ? void 0 : _c.duration) ||
            !((_d = profile.workingDays) === null || _d === void 0 ? void 0 : _d.length)) {
            return next(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Complete working hours information is required for providers"));
        }
        if (!profile.hourlyRate) {
            return next(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Hourly rate is required for providers"));
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
userSchema.statics.isExistUserById = async (id) => {
    const isExist = await exports.User.findById(id);
    return isExist;
};
userSchema.statics.isExistUserByEmail = async (email) => {
    const isExist = await exports.User.findOne({ email: email });
    return isExist;
};
userSchema.statics.isMatchPassword = async (password, hashPassword) => {
    return await bcrypt_1.default.compare(password, hashPassword);
};
userSchema.pre("save", async function (next) {
    if (this.isNew) {
        const email = this.email;
        if (email) {
            const existingUser = await exports.User.findOne({
                email: email,
            });
            if (existingUser) {
                return next(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email already exists!"));
            }
        }
    }
    next();
});
exports.User = (0, mongoose_1.model)("User", userSchema);
