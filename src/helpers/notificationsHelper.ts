import { ClientSession } from "mongoose";
import { INotification } from "../app/modules/notification/notification.interface";
import { Notification } from "../app/modules/notification/notification.model";


export const sendNotifications = async (payload:INotification, session?: ClientSession):Promise<INotification> =>{

    const result = (await Notification.create([payload], {session}))[0];

    //@ts-ignore
    const socketIo = global.io;

    if (socketIo && payload.receiver) {
        socketIo.emit(`notification::${payload.receiver}`, result);
    }

    return result;
}