"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const user_model_1 = require("../user/user.model");
const validPhoneNumberCheck_1 = require("../../../util/validPhoneNumberCheck");
const sendSMS_1 = __importDefault(require("../../../shared/sendSMS"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const wallet_model_1 = require("../wallet/wallet.model");
// Send OTP for email verification
const sendEmailOtp = async (data) => {
    const otp = (0, generateOTP_1.default)();
    const expireAt = new Date(Date.now() + 5 * 60 * 1000);
    // Simply create new user with OTP
    const user = await user_model_1.User.create({
        email: data.email,
        role: data.role,
        isEmailVerified: false,
        authentication: {
            purpose: "email_verify",
            channel: "email",
            oneTimeCode: otp,
            expireAt,
        },
    });
    const emailContent = emailTemplate_1.emailTemplate.createAccount({
        email: data.email,
        otp,
    });
    setTimeout(() => {
        emailHelper_1.emailHelper.sendEmail(emailContent);
    }, 0);
    return { userId: user._id, email: data.email };
};
// Send OTP to phone
const sendPhoneOtp = async (payload) => {
    const otp = (0, generateOTP_1.default)();
    const expireAt = new Date(Date.now() + 5 * 60 * 1000);
    // First find the user
    const user = await user_model_1.User.findById(payload.id);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    // Update user fields
    user.phone = payload.phone;
    user.authentication = {
        purpose: "phone_verify",
        channel: "phone",
        oneTimeCode: otp,
        expireAt,
    };
    user.isPhoneVerified = false;
    // Save the user (this will trigger validations)
    await user.save();
    // Send SMS after saving user
    await (0, sendSMS_1.default)(payload.phone, otp.toString());
    return { userId: user._id, phone: payload.phone };
};
// Verify OTP
const verifyOtp = async (payload) => {
    const { purpose, channel, identifier, oneTimeCode } = payload;
    const query = channel === "email" ? { email: identifier } : { phone: identifier };
    const user = await user_model_1.User.findOne(query).select("+authentication");
    if (!user || !user.authentication) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User or OTP not found");
    }
    const auth = user.authentication;
    if (!auth.purpose) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "OTP not found");
    }
    if (auth.purpose !== purpose)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "OTP purpose mismatch");
    if (auth.channel !== channel)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "OTP channel mismatch");
    if (auth.oneTimeCode !== Number(oneTimeCode))
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid OTP");
    if (new Date() > new Date(auth.expireAt))
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "OTP expired");
    // ✅ Mark verified according to purpose
    if (purpose === "email_verify") {
        user.isEmailVerified = true;
        await wallet_model_1.Wallet.create({ user: user._id });
    }
    if (purpose === "phone_verify")
        user.isPhoneVerified = true;
    // Clear authentication
    user.authentication = undefined;
    await user.save();
    // ✅ Generate tokens for both login_otp AND email_verify purposes
    let tokens = null;
    let userInfo = null;
    if (purpose === "login_otp" || purpose === "email_verify") {
        const [accessToken, refreshToken, biometricToken] = await Promise.all([
            jwtHelper_1.jwtHelper.createToken({
                id: user._id,
                role: user.role,
                email: user.email,
            }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in),
            jwtHelper_1.jwtHelper.createToken({
                id: user._id,
                role: user.role,
                email: user.email,
            }, config_1.default.jwt.jwtRefreshSecret, config_1.default.jwt.jwtRefreshExpiresIn),
            jwtHelper_1.jwtHelper.createToken({
                id: user._id,
                role: user.role,
                email: user.email,
            }, config_1.default.jwt.jwtBiometricSecret, config_1.default.jwt.jwtBiometricExpiresIn),
        ]);
        tokens = {
            accessToken,
            refreshToken,
            ...(purpose === "login_otp" &&
                user.biometricEnabled && { biometricToken }),
        };
        userInfo = {
            userId: user._id,
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            profilePicture: user.profilePicture,
            role: user.role,
        };
    }
    if (purpose === "biometric_enable") {
        await user_model_1.User.findByIdAndUpdate(user.id, {
            biometricEnabled: true,
        });
        const biometricToken = jwtHelper_1.jwtHelper.createToken({
            id: user._id,
            role: user.role,
            email: user.email,
        }, config_1.default.jwt.jwtBiometricSecret, config_1.default.jwt.jwtBiometricExpiresIn);
        tokens = { biometricToken };
        userInfo = {
            userId: user._id,
            email: user.email,
            phone: user.phone,
            fullName: user.fullName,
            profilePicture: user.profilePicture,
            role: user.role,
        };
    }
    return {
        success: true,
        message: `${purpose.replace("_", " ")} verified successfully`,
        data: {
            ...(userInfo && userInfo),
            ...(tokens && tokens),
        },
    };
};
// Login user from DB
const loginUserFromDB = async (payload) => {
    const { email } = payload;
    // Validate email
    if (!email) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Email is required for login");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please enter a valid email address");
    }
    // Find user by email
    const existingUser = await user_model_1.User.findOne({ email });
    // If user doesn't exist
    if (!existingUser) {
        return {
            register: true,
            verify: false,
            message: "User not found. Please register first.",
        };
    }
    // Generate OTP for login
    const otp = (0, generateOTP_1.default)();
    const authentication = {
        purpose: "login_otp",
        channel: "email",
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    // Update user with OTP
    await user_model_1.User.updateOne({ _id: existingUser._id }, { $set: { authentication } });
    // send login otp email
    const emailContent = emailTemplate_1.emailTemplate.loginOtp({
        email,
        otp,
    });
    setTimeout(() => {
        emailHelper_1.emailHelper.sendEmail(emailContent);
    }, 0);
    return {
        success: true,
        message: "Login OTP sent to your email",
        userId: existingUser._id,
    };
};
// Biometric login
const biometricLogin = async (biometricToken) => {
    if (!biometricToken) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Biometric token required");
    }
    const decoded = jwtHelper_1.jwtHelper.verifyToken(biometricToken, config_1.default.jwt.jwtBiometricSecret);
    const user = await user_model_1.User.findById(decoded.id);
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not found");
    }
    if (!user.biometricEnabled) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Biometric login is not enabled for this user");
    }
    const userInfo = {
        userId: user._id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        role: user.role,
    };
    const accessToken = await jwtHelper_1.jwtHelper.createToken({ id: user._id, role: user.role, email: user.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    return { accessToken, userInfo };
};
// Generate new access token
const newAccessTokenToUser = async (token) => {
    // Check if the token is provided
    if (!token) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Token is required!");
    }
    const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwtRefreshSecret);
    const isExistUser = await user_model_1.User.findById(verifyUser === null || verifyUser === void 0 ? void 0 : verifyUser.id);
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized access");
    }
    // Create token
    const accessToken = await jwtHelper_1.jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, phone: isExistUser.phone }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    return { accessToken };
};
// Send password reset OTP
const sendPasswordResetOtp = async (email) => {
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    const otp = (0, generateOTP_1.default)();
    user.authentication = {
        purpose: "password_reset",
        channel: "email",
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    await user.save();
    const emailContent = emailTemplate_1.emailTemplate.resetPassword({ email, otp });
    await emailHelper_1.emailHelper.sendEmail(emailContent);
    return { email };
};
// Send OTP for number change
const sendNumberChangeOtp = async (oldPhone, newPhone) => {
    const user = await user_model_1.User.findOne({ phone: oldPhone });
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Old phone not found");
    const otp = (0, generateOTP_1.default)();
    user.authentication = {
        purpose: "number_change",
        channel: "phone",
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    await user.save();
    await (0, sendSMS_1.default)(newPhone, otp.toString());
    return { oldPhone, newPhone };
};
// Complete profile
const completeProfile = async (user, payload) => {
    const userFromDB = await user_model_1.User.findById(user.id);
    if (!userFromDB)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    // Update fields and trigger .save() for hooks
    Object.assign(userFromDB, payload);
    const res = await userFromDB.save();
    return { res };
};
// Resend OTP
const resendOtp = async (identifier) => {
    if (typeof identifier !== "string") {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Identifier must be an email or phone number");
    }
    const value = identifier.trim();
    if (!value) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Identifier is required");
    }
    const isEmail = value.includes("@") &&
        value.includes(".") &&
        value.indexOf("@") < value.lastIndexOf(".");
    const numericValue = value.replace(/\s/g, "");
    const isPhone = !isEmail &&
        Number.isInteger(Number(numericValue)) &&
        numericValue.length >= 8 &&
        numericValue.length <= 15;
    if (!isEmail && !isPhone) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid email or phone number");
    }
    const query = isEmail
        ? { email: value.toLowerCase() }
        : { phone: numericValue };
    const user = await user_model_1.User.findOne(query).select("+authentication");
    if (!user) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (!user.authentication) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No OTP request found for this user");
    }
    const { purpose, channel } = user.authentication;
    const newOtp = (0, generateOTP_1.default)();
    user.authentication.oneTimeCode = newOtp;
    user.authentication.expireAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();
    if (channel === "email") {
        setTimeout(() => {
            emailHelper_1.emailHelper.sendEmail(emailTemplate_1.emailTemplate.resendOtpEmail({
                email: user.email,
                otp: newOtp,
                purpose,
            }));
        }, 0);
    }
    else {
        await (0, sendSMS_1.default)(numericValue, `Your OTP is ${newOtp}. Valid for 5 minutes.`);
    }
    return {
        success: true,
        message: `New OTP sent via ${channel}`,
        purpose,
        channel,
    };
};
// Enable biometric login
const enableBiometric = async (email) => {
    const isExistUser = await user_model_1.User.findOne({ email });
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "You are not registered");
    }
    if (!isExistUser.isEmailVerified) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please verify your email first");
    }
    const otp = (0, generateOTP_1.default)();
    const expireAt = new Date(Date.now() + 5 * 60 * 1000);
    // Update user with OTP
    await user_model_1.User.findOneAndUpdate({ email }, {
        authentication: {
            purpose: "biometric_enable",
            channel: "email",
            oneTimeCode: otp,
            expireAt,
        },
    });
    const emailContent = emailTemplate_1.emailTemplate.resendOtpEmail({
        email: isExistUser.email,
        otp,
        purpose: "biometric_enable",
    });
    setTimeout(() => {
        emailHelper_1.emailHelper.sendEmail(emailContent);
    }, 0);
};
// delete user
const deleteUserFromDB = async (user, phone) => {
    // Validate phone number
    if (!(0, validPhoneNumberCheck_1.validPhoneNumberCheck)(phone)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid phone number. Please enter a valid number to receive an OTP.");
    }
    const isExistUser = await user_model_1.User.findOne({ phone });
    if (!isExistUser) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // Generate OTP
    const otp = (0, generateOTP_1.default)();
    const authentication = {
        purpose: "phone_verify",
        channel: "phone",
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60 * 1000),
    };
    await (0, sendSMS_1.default)(phone, otp.toString());
    await user_model_1.User.updateOne({ _id: isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser._id }, { $set: { authentication } });
    return "Verification OTP sent to your phone number. Kindly verify to delete your account";
};
exports.AuthService = {
    loginUserFromDB,
    newAccessTokenToUser,
    deleteUserFromDB,
    sendEmailOtp,
    sendPhoneOtp,
    sendPasswordResetOtp,
    sendNumberChangeOtp,
    verifyOtp,
    completeProfile,
    resendOtp,
    enableBiometric,
    biometricLogin,
};
