"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validateRequest = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            params: req.params,
            query: req.query,
            cookies: req.cookies
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = validateRequest;
