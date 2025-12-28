"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChatZod = exports.createChatZod = void 0;
const zod_1 = require("zod");
exports.createChatZod = zod_1.z.object({
    body: zod_1.z.object({
        participant: zod_1.z.string().min(1, 'Participant ID is required'),
    }),
});
exports.deleteChatZod = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Chat ID is required'),
    }),
});
