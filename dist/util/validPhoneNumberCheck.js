"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validPhoneNumberCheck = void 0;
const google_libphonenumber_1 = require("google-libphonenumber");
const validPhoneNumberCheck = (phone) => {
    try {
        const phoneUtil = google_libphonenumber_1.PhoneNumberUtil.getInstance();
        const phoneNumber = phoneUtil.parseAndKeepRawInput(phone);
        return phoneUtil.isValidNumber(phoneNumber);
    }
    catch (error) {
        console.error('Invalid phone number format:', error);
        return false;
    }
};
exports.validPhoneNumberCheck = validPhoneNumberCheck;
