"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceZod = exports.createServiceZod = void 0;
// service.validation.ts
const zod_1 = require("zod");
// Base service validation (common for all levels)
const baseServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Service name is required"),
    image: zod_1.z.string().min(1, "Image URL is required"),
    isActive: zod_1.z.boolean().default(true),
});
// Create service validation
exports.createServiceZod = zod_1.z.object({
    body: baseServiceSchema.extend({
        parent: zod_1.z.string().optional().nullable(),
    }).strict(),
});
// Update service validation
exports.updateServiceZod = zod_1.z.object({
    body: baseServiceSchema.partial().strict(),
});
