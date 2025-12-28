"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referenceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: false
    },
    screen: {
        type: String,
        required: false
    },
    read: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    }
}, {
    timestamps: true
});
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
