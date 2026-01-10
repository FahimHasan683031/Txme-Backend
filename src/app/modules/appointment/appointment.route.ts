import express from 'express';
import { AppointmentController } from './appointment.controller';
import auth from '../../middlewares/auth';
import { ADMIN_ROLES, USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.post('/create',
    auth(USER_ROLES.CUSTOMER),
    AppointmentController.createAppointment
);

router.get('/my-appointments',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    AppointmentController.getMyAppointments
);

router.get('/current-appointment',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    AppointmentController.getCurrentAppointment
);

router.get('/',
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    AppointmentController.getAllAppointments
);

router.patch('/update-status/:appointmentId',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    AppointmentController.updateAppointmentStatus
);

router.post(
    '/pay-with-wallet/:appointmentId',
    auth(USER_ROLES.CUSTOMER),
    AppointmentController.payWithWallet
);

router.get('/:id',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    AppointmentController.getSingleAppointment
);

export const AppointmentRoutes = router;