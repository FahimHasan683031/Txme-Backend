import QueryBuilder from "../../../helpers/QueryBuilder";
import { IService } from "./service.interface";
import { ServiceModel } from "./service.model";
import { delCachePattern, getCache, setCache } from "../../../helpers/redisHelper";

// Create service
const createService = async (payload: IService) => {
  const result = await ServiceModel.create(payload);
  await delCachePattern("cache:services:*");
  return result;
};

// Get all services
const getAllServices = async (query: Record<string, unknown>) => {

  const serviceQueryBuilder = new QueryBuilder(ServiceModel.find(!query.parent ? { parent: null } : { parent: query.parent }), query)
    .filter()
    .fields()

  const totalServices = await ServiceModel.countDocuments()

  const services = await serviceQueryBuilder.modelQuery.lean()

  return {
    services,
  };
};



// Get all child services
const getAllChildServices = async () => {
  const cacheKey = "cache:services:children";
  const cachedResult = await getCache<any>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const result = await ServiceModel.find({ parent: { $ne: null } }).lean();
  await setCache(cacheKey, result, 3600); // 1 Hour TTL
  return result;
};

// Update service
const updateService = async (id: string, payload: IService) => {
  const result = await ServiceModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  await delCachePattern("cache:services:*");
  return result;
};

// Delete service
const deleteService = async (id: string) => {
  const result = await ServiceModel.findByIdAndDelete(id);
  await delCachePattern("cache:services:*");
  return result;
};


export const serviceService = {
  createService,
  getAllServices,
  updateService,
  deleteService,
  getAllChildServices,
};