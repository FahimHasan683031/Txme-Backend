"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceService = void 0;
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const service_model_1 = require("./service.model");
// Create service
const createService = async (payload) => {
    const result = await service_model_1.ServiceModel.create(payload);
    return result;
};
// Get all services
const getAllServices = async (query) => {
    const serviceQueryBuilder = new QueryBuilder_1.default(service_model_1.ServiceModel.find(!query.parent ? { parent: null } : { parent: query.parent }), query)
        .filter()
        .fields();
    const totalServices = await service_model_1.ServiceModel.countDocuments();
    const services = await serviceQueryBuilder.modelQuery;
    return {
        services,
    };
};
// Get all child services
const getAllChildServices = async () => {
    const result = await service_model_1.ServiceModel.find({ parent: { $ne: null } });
    return result;
};
// Update service
const updateService = async (id, payload) => {
    const result = await service_model_1.ServiceModel.findByIdAndUpdate(id, payload, {
        new: true,
    });
    return result;
};
// Delete service
const deleteService = async (id) => {
    const result = await service_model_1.ServiceModel.findByIdAndDelete(id);
    return result;
};
exports.serviceService = {
    createService,
    getAllServices,
    updateService,
    deleteService,
    getAllChildServices,
};
