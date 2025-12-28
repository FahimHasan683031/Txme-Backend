"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportZodValidationSchema = void 0;
const zod_1 = require("zod");
exports.supportZodValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string({ required_error: "Message is required" })
    })
});
