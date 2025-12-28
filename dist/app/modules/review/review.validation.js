"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReviewZod = exports.createReviewZod = void 0;
const zod_1 = require("zod");
exports.createReviewZod = zod_1.z.object({
    body: zod_1.z.object({
        reviewee: zod_1.z.string(),
        service: zod_1.z.string(),
        appointment: zod_1.z.string(),
        rating: zod_1.z.number().min(1).max(5),
        comment: zod_1.z.string().optional(),
    }),
});
exports.updateReviewZod = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number().min(1).max(5).optional(),
        comment: zod_1.z.string().optional(),
    }),
});
