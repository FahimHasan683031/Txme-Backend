"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const rule_model_1 = require("./rule.model");
//privacy policy
const createPrivacyPolicyToDB = async (payload) => {
    // check if privacy policy exist or not
    const isExistPrivacy = await rule_model_1.Rule.findOne({ type: 'privacy' });
    if (isExistPrivacy) {
        // update privacy is exist 
        const result = await rule_model_1.Rule.findOneAndUpdate({ type: 'privacy' }, { content: payload === null || payload === void 0 ? void 0 : payload.content }, { new: true });
        const message = "Privacy & Policy Updated successfully";
        return { message, result };
    }
    else {
        // create new if not exist
        const result = await rule_model_1.Rule.create({ ...payload, type: 'privacy' });
        const message = "Privacy & Policy Created successfully";
        return { message, result };
    }
};
const getPrivacyPolicyFromDB = async () => {
    const result = await rule_model_1.Rule.findOne({ type: 'privacy' });
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Privacy policy doesn't exist!");
    }
    return result;
};
//terms and conditions
const createTermsAndConditionToDB = async (payload) => {
    const isExistTerms = await rule_model_1.Rule.findOne({ type: 'terms' });
    if (isExistTerms) {
        const result = await rule_model_1.Rule.findOneAndUpdate({ type: 'terms' }, { content: payload === null || payload === void 0 ? void 0 : payload.content }, { new: true });
        const message = "Terms And Condition Updated successfully";
        return { message, result };
    }
    else {
        const result = await rule_model_1.Rule.create({ ...payload, type: 'terms' });
        const message = "Terms And Condition Created Successfully";
        return { message, result };
    }
};
const getTermsAndConditionFromDB = async () => {
    const result = await rule_model_1.Rule.findOne({ type: 'terms' });
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Terms and conditions doesn't  exist!");
    }
    return result;
};
//privacy policy
const createAboutToDB = async (payload) => {
    const isExistAbout = await rule_model_1.Rule.findOne({ type: 'about' });
    if (isExistAbout) {
        const result = await rule_model_1.Rule.findOneAndUpdate({ type: 'about' }, { content: payload === null || payload === void 0 ? void 0 : payload.content }, { new: true });
        const message = "About Us Updated successfully";
        return { message, result };
    }
    else {
        const result = await rule_model_1.Rule.create({ ...payload, type: 'about' });
        const message = "About Us created successfully";
        return { message, result };
    }
};
const getAboutFromDB = async () => {
    const result = await rule_model_1.Rule.findOne({ type: 'about' });
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "About doesn't exist!");
    }
    return result;
};
exports.RuleService = {
    createPrivacyPolicyToDB,
    getPrivacyPolicyFromDB,
    createTermsAndConditionToDB,
    getTermsAndConditionFromDB,
    createAboutToDB,
    getAboutFromDB
};
