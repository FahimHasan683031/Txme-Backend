"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsReadZod = exports.getMessageZod = exports.sendMessageZod = void 0;
const zod_1 = require("zod");
const message_1 = require("../../../enums/message");
exports.sendMessageZod = zod_1.z.object({
    body: zod_1.z.object({
        chatId: zod_1.z.string().min(1, 'Chat ID is required'),
        text: zod_1.z.string().optional(),
        image: zod_1.z.string().optional(),
        type: zod_1.z.nativeEnum(message_1.MESSAGE).optional(),
    }).refine((data) => data.text || data.image, {
        message: 'Either text or image must be provided',
    }),
});
exports.getMessageZod = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Chat ID is required'),
    }),
});
exports.markAsReadZod = zod_1.z.object({
    params: zod_1.z.object({
        chatId: zod_1.z.string().min(1, 'Chat ID is required'),
    }),
});
