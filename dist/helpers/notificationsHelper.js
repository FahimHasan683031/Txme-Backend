"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotifications = void 0;
const notification_model_1 = require("../app/modules/notification/notification.model");
const sendNotifications = async (payload, session) => {
    const result = (await notification_model_1.Notification.create([payload], { session }))[0];
    //@ts-ignore
    const socketIo = global.io;
    if (socketIo && payload.receiver) {
        socketIo.emit(`notification::${payload.receiver}`, result);
    }
    return result;
};
exports.sendNotifications = sendNotifications;
