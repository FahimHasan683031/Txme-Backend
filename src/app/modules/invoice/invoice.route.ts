import express from 'express';
import { InvoiceController } from './invoice.controller';
import auth from '../../middlewares/auth';
import { ADMIN_ROLES, USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get(
    '/transaction/:id',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    InvoiceController.downloadTransactionInvoice
);

router.get(
    '/appointment/:id',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    InvoiceController.downloadAppointmentInvoice
);


export const InvoiceRoutes = router;
