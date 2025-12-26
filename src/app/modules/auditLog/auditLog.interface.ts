import { Model, Types } from 'mongoose';

export type IAuditLog = {
    user: Types.ObjectId;
    action: string;
    details: string;
};

export type AuditLogModel = Model<IAuditLog>;
