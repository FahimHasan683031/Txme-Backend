"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const message_1 = require("../../../enums/message");
const messageSchema = new mongoose_1.Schema({
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'Chat',
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    text: {
        type: String,
        required: false
    },
    files: {
        type: [String],
        required: false
    },
    type: {
        type: String,
        enum: Object.values(message_1.MESSAGE),
        default: message_1.MESSAGE.Text
    },
    readBy: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    amount: {
        type: Number,
        required: false
    },
    moneyRequestStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        required: false,
        default: function () {
            return this.type === message_1.MESSAGE.MoneyRequest ? 'pending' : undefined;
        }
    }
}, {
    timestamps: true,
});
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
