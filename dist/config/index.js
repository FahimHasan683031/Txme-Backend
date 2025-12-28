"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
exports.default = {
    ip_address: process.env.IP,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    node_env: process.env.NODE_ENV,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        jwt_expire_in: process.env.JWT_EXPIRE_IN,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        jwtBiometricSecret: process.env.JWT_BIOMETRIC_SECRET,
        jwtBiometricExpiresIn: process.env.JWT_BIOMETRIC_EXPIRES_IN,
    },
    stripe: {
        stripeSecretKey: process.env.STRIPE_API_SECRET,
        webhookSecret: process.env.WEBHOOK_SECRET,
        paymentSuccess: process.env.SUCCESS_URL
    },
    email: {
        from: process.env.EMAIL_FROM,
        user: process.env.EMAIL_USER,
        port: process.env.EMAIL_PORT,
        host: process.env.EMAIL_HOST,
        pass: process.env.EMAIL_PASS
    },
    admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
    },
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        twilioNumber: process.env.TWILIO_NUMBER
    },
    cloudinary: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    }
};
