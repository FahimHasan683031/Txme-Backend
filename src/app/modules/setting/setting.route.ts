import express from 'express';
import { ADMIN_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { SettingController } from './setting.controller';

const router = express.Router();

router.get(
    '/',
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    SettingController.getSetting
);

router.patch(
    '/',
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    SettingController.updateSetting
);

export const SettingRoutes = router;
