"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = require("../../../enums/user");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const AdminSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: user_1.ADMIN_ROLES,
        default: user_1.ADMIN_ROLES.ADMIN,
    },
    status: {
        type: String,
        enum: ["active", "inactive", "delete"],
        default: "active",
    },
    verified: {
        type: Boolean,
        default: true,
    },
    authentication: {
        type: {
            isResetPassword: {
                type: Boolean,
                default: false,
            },
            oneTimeCode: {
                type: Number,
                default: null,
            },
            expireAt: {
                type: Date,
                default: null,
            },
        },
        select: 0,
    },
}, {
    timestamps: true,
});
//exist user check
AdminSchema.statics.isExistUserById = async (id) => {
    const isExist = await exports.Admin.findById(id);
    return isExist;
};
AdminSchema.statics.isExistUserByEmail = async (email) => {
    const isExist = await exports.Admin.findOne({ email });
    return isExist;
};
//is match password
AdminSchema.statics.isMatchPassword = async (password, hashPassword) => {
    return await bcryptjs_1.default.compare(password, hashPassword);
};
//make password secure
AdminSchema.pre("save", async function (next) {
    //check user
    const isExist = await exports.Admin.findOne({ email: this.email });
    if (isExist) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "A user already exist with this email!");
    }
    //password hash
    this.password = await bcryptjs_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
    next();
});
exports.Admin = mongoose_1.default.model("Admin", AdminSchema);
