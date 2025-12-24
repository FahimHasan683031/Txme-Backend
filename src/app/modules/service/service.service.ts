import QueryBuilder from "../../../helpers/QueryBuilder";
import { IService } from "./service.interface";
import { ServiceModel } from "./service.model";

// Create service
const createService = async (payload: IService) => {
  const result = await ServiceModel.create(payload);
  return result;
};

// Get all services
const getAllServices = async (query: Record<string, unknown>) => {

  const serviceQueryBuilder = new QueryBuilder(ServiceModel.find(!query.parent ? { parent: null } : { parent: query.parent }), query)
    .filter()
    .fields()

  const totalServices = await ServiceModel.countDocuments()

  const services = await serviceQueryBuilder.modelQuery

  return {
    services,
  };
};



// Get all child services
const getAllChildServices = async () => {
  const result = await ServiceModel.find({ parent: { $ne: null } });
  return result;
};

// Update service
const updateService = async (id: string, payload: IService) => {
  const result = await ServiceModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return result;
};

// Delete service
const deleteService = async (id: string) => {
  const result = await ServiceModel.findByIdAndDelete(id);
  return result;
};


export const serviceService = {
  createService,
  getAllServices,
  updateService,
  deleteService,
  getAllChildServices,
};