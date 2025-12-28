"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Review = void 0;
const mongoose_1 = require("mongoose");
const reviewSchema = new mongoose_1.Schema({
    reviewer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reviewee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    service: {
        type: String,
        required: true,
    },
    appointment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    comment: {
        type: String,
    },
}, { timestamps: true });
exports.Review = (0, mongoose_1.model)("Review", reviewSchema);
