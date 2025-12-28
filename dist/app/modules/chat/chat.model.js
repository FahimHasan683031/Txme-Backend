"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const chatSchema = new mongoose_1.Schema({
    participants: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    isAdminSupport: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastMessageAt: {
        type: Date
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
exports.Chat = (0, mongoose_1.model)('Chat', chatSchema);
