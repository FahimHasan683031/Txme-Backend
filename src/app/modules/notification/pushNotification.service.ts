import * as admin from 'firebase-admin';
import path from 'path';
import config from '../../../config';
import { logger } from '../../../shared/logger';

// Initialize Firebase Admin
let isFirebaseInitialized = false;

const initializeFirebase = () => {
    try {
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
        });

        isFirebaseInitialized = true;
        logger.info('Firebase Admin initialized successfully');
    } catch (error) {
        logger.error('Firebase Admin initialization failed:', error);
    }
};

const sendPushNotification = async (
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
) => {
    if (!isFirebaseInitialized) {
        initializeFirebase();
    }

    if (!isFirebaseInitialized) {
        logger.warn('Push notification skipped: Firebase not initialized');
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
        logger.info('Push notification sent successfully:', response);
        return response;
    } catch (error) {
        logger.error('Error sending push notification:', error);
    }
};

export const PushNotificationService = {
    sendPushNotification,
};
