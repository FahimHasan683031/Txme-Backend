"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const support_validation_1 = require("./support.validation");
const support_controller_1 = require("./support.controller");
const router = express_1.default.Router();
router.route('/')
    .post((0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), async (req, res, next) => {
    try {
        req.body = { user: req.user.id, ...req.body };
        next();
    }
    catch (error) {
        res.status(500).json({ message: "Failed to submitted" });
    }
}, (0, validateRequest_1.default)(support_validation_1.supportZodValidationSchema), support_controller_1.SupportController.makeSupport)
    .get((0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.SUPER_ADMIN), support_controller_1.SupportController.supports);
exports.SupportRoutes = router;
