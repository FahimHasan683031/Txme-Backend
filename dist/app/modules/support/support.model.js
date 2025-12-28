"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Support = void 0;
const mongoose_1 = require("mongoose");
const SupportSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true });
exports.Support = (0, mongoose_1.model)("Support", SupportSchema);
