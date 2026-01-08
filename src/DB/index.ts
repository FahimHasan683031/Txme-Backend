import colors from 'colors';
import config from '../config';
import { ADMIN_ROLES } from '../enums/user';
import { logger } from '../shared/logger';
import { Admin } from '../app/modules/admin/admin.model';
import { PromotionPackage } from '../app/modules/promotion/promotion.model';

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
    } else {
        logger.info(colors.green('ℹ Super admin already exists!'));
    }
};

const seedPromotionPackages = async () => {
    const isExist = await PromotionPackage.findOne();
    if (!isExist) {
        await PromotionPackage.create([
            {
                title: "1 Day Boost",
                productId: "com.txme.promo.1day",
                durationDays: 1,
                price: 0,
                description: "Boost your profile for 24 hours"
            },
            {
                title: "7 Days Boost",
                productId: "com.txme.promo.7days",
                durationDays: 7,
                price: 0,
                description: "Boost your profile for 1 week"
            }
        ]);
        logger.info(colors.green('✔ Default promotion packages seeded!'));
    }
};

const seed = async () => {
    await seedSuperAdmin();
    await seedPromotionPackages();
};

export default seed;