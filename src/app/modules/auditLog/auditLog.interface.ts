import { Model, Types } from 'mongoose';

export type IAuditLog = {
    user: Types.ObjectId;
    action: string;
    targetModule: string;
    details: {
        oldValue: any;
        newValue: any;
        changes?: any;
    };
};

export type AuditLogModel = Model<IAuditLog>;
