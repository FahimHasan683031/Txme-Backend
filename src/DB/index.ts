import colors from 'colors';
import { User } from '../app/modules/user/user.model';
import config from '../config';
import { ADMIN_ROLES, USER_ROLES } from '../enums/user';
import { logger } from '../shared/logger';
import { Admin } from '../app/modules/admin/admin.model';

const superAdmin = {
    name: 'Administrator',
    role: ADMIN_ROLES.SUPER_ADMIN,
    email: config.admin.email,
    password: config.admin.password,
    verified: true,
};

const seedSuperAdmin = async () => {
    const isExistSuperAdmin = await Admin.findOne({
        role: ADMIN_ROLES.SUPER_ADMIN,
    });



    if (!isExistSuperAdmin) {
        await Admin.create(superAdmin);
        logger.info(colors.green('✔ Super admin created successfully!'));
    }
};

export default seedSuperAdmin;