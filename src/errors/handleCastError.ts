import mongoose from 'mongoose';
import { IErrorMessage } from '../types/errors.types';
import { StatusCodes } from 'http-status-codes';

const handleCastError = (error: mongoose.Error.CastError) => {
    const errorMessages: IErrorMessage[] = [
        {
            path: error.path,
            message: 'Invalid ID',
        },
    ];

    const statusCode = StatusCodes.BAD_REQUEST;
    return {
        statusCode,
        message: 'Invalid ID',
        errorMessages,
    };
};

export default handleCastError;
