import { z } from 'zod';

const sendMoney = z.object({
    body: z.object({
        receiverIdOrEmail: z.string({
            required_error: 'receiverId is required',
        }).min(1, 'receiverIdOrEmail cannot be empty'),
        amount: z.number({
            required_error: 'amount is required',
        }).positive('amount must be a positive number'),
    }),
});

const withdraw = z.object({
    body: z.object({
        amount: z.number({
            required_error: 'amount is required',
        }).positive('amount must be a positive number'),
    }),
});

export const WalletValidation = {
    sendMoney,
    withdraw,
};
