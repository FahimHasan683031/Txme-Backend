import { model, Schema } from 'mongoose';
import { IAuditLog, AuditLogModel } from './auditLog.interface';

const auditLogSchema = new Schema<IAuditLog, AuditLogModel>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
            required: true
        },
        action: {
            type: String,
            required: true
        },
        details: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const AuditLog = model<IAuditLog, AuditLogModel>('AuditLog', auditLogSchema);
