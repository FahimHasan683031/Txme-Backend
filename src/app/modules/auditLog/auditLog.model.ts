import { model, Schema } from 'mongoose';
import { IAuditLog, AuditLogModel } from './auditLog.interface';

const auditLogSchema = new Schema<IAuditLog, AuditLogModel>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        action: {
            type: String,
            required: true
        },
        targetModule: {
            type: String,
            required: true
        },
        details: {
            oldValue: { type: Schema.Types.Mixed },
            newValue: { type: Schema.Types.Mixed },
            changes: { type: Schema.Types.Mixed }
        }
    },
    {
        timestamps: true
    }
);

export const AuditLog = model<IAuditLog, AuditLogModel>('AuditLog', auditLogSchema);
