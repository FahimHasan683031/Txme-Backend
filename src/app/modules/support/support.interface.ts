import { Model, Types } from "mongoose"

export type ISupport = {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    message: string;
}

export type SupportModel = Model<ISupport, Record<string, unknown>>;