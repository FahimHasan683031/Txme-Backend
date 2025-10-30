import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { ISupport } from "./support.interface";
import { Support } from "./support.model";
import { FilterQuery } from "mongoose";
import QueryBuilder from "../../../helpers/QueryBuilder";

const makeSupportInDB = async(payload: ISupport): Promise<ISupport>=>{
    const support = await Support.create(payload);
    if(!support){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to Submit");
    }
    return support;
}

const supportsFromDB = async(query: FilterQuery<any>): Promise<{supports: ISupport, pagination:any}>=>{
    const support = new QueryBuilder(Support.find(), query).paginate();
    const supports = await support.queryModel;
    const pagination = await support.getPaginationInfo();

    return { supports, pagination}
}

export const SupportService = {
    makeSupportInDB,
    supportsFromDB
}