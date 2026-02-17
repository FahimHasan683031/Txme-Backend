"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const config_1 = __importDefault(require("../config"));
const user_1 = require("../enums/user");
const logger_1 = require("../shared/logger");
const admin_model_1 = require("../app/modules/admin/admin.model");
const superAdmin = {
    name: 'Administrator',
    role: user_1.ADMIN_ROLES.SUPER_ADMIN,
    email: config_1.default.admin.email,
    password: config_1.default.admin.password,
    verified: true,
};
const seedSuperAdmin = async () => {
    const isExistSuperAdmin = await admin_model_1.Admin.findOne({
        role: user_1.ADMIN_ROLES.SUPER_ADMIN,
    });
    if (!isExistSuperAdmin) {
        await admin_model_1.Admin.create(superAdmin);
        logger_1.logger.info(colors_1.default.green('✔ Super admin created successfully!'));
    }
    else {
        logger_1.logger.info(colors_1.default.green('ℹ Super admin already exists!'));
    }
};
const seed = async () => {
    await seedSuperAdmin();
};
exports.default = seed;
