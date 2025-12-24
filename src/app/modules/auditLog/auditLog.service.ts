import { IAuditLog } from './auditLog.interface';
import { AuditLog } from './auditLog.model';
import QueryBuilder from '../../../helpers/QueryBuilder';
import { FilterQuery } from 'mongoose';

const createLog = async (payload: IAuditLog): Promise<IAuditLog> => {
    const result = await AuditLog.create(payload);
    return result;
};

const getLogsFromDB = async (query: FilterQuery<any>) => {
    const logQuery = new QueryBuilder(AuditLog.find().populate('user', 'fullName email role'), query)
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await logQuery.modelQuery;
    const meta = await logQuery.getPaginationInfo();

    return {
        meta,
        result
    };
};

export const AuditLogService = {
    createLog,
    getLogsFromDB
};
