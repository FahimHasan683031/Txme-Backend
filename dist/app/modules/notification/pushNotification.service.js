"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const admin = __importStar(require("firebase-admin"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../../shared/logger");
// Initialize Firebase Admin
let isFirebaseInitialized = false;
const initializeFirebase = () => {
    try {
        const serviceAccountPath = path_1.default.join(process.cwd(), 'serviceAccountKey.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
        });
        isFirebaseInitialized = true;
        logger_1.logger.info('Firebase Admin initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('Firebase Admin initialization failed:', error);
    }
};
const sendPushNotification = async (fcmToken, title, body, data) => {
    if (!isFirebaseInitialized) {
        initializeFirebase();
    }
    if (!isFirebaseInitialized) {
        logger_1.logger.warn('Push notification skipped: Firebase not initialized');
        return;
    }
    const message = {
        notification: {
            title,
            body,
        },
        data: data || {},
        token: fcmToken,
    };
    try {
        const response = await admin.messaging().send(message);
        logger_1.logger.info('Push notification sent successfully:', response);
        return response;
    }
    catch (error) {
        logger_1.logger.error('Error sending push notification:', error);
    }
};
exports.PushNotificationService = {
    sendPushNotification,
};
