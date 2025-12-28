"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const auditLog_model_1 = require("./auditLog.model");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const createLog = async (payload) => {
    const result = await auditLog_model_1.AuditLog.create(payload);
    return result;
};
const getLogsFromDB = async (query) => {
    const logQuery = new QueryBuilder_1.default(auditLog_model_1.AuditLog.find().populate('user', 'fullName email role'), query)
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
exports.AuditLogService = {
    createLog,
    getLogsFromDB
};
