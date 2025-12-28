"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetToken = void 0;
const mongoose_1 = require("mongoose");
const resetTokenSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    token: {
        type: String,
        required: true,
    },
    expireAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
//token check
resetTokenSchema.statics.isExistToken = async (token) => {
    return await exports.ResetToken.findOne({ token });
};
//token validity check
resetTokenSchema.statics.isExpireToken = async (token) => {
    const currentDate = new Date();
    const resetToken = await exports.ResetToken.findOne({
        token,
        expireAt: { $gt: currentDate },
    });
    return !!resetToken;
};
exports.ResetToken = (0, mongoose_1.model)('Token', resetTokenSchema);
