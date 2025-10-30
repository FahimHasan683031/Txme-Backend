import express from 'express'
import { USER_ROLES } from '../../../enums/user'
import auth from '../../middlewares/auth'
import validateRequest from '../../middlewares/validateRequest'
import { CategoryController } from './category.controller'
import { categoryZodValidationSchema } from './category.validation'
import fileUploadHandler from '../../middlewares/fileUploaderHandler'
import { getSingleFilePath } from '../../../shared/getFilePath';
const router = express.Router()

router.route("/")
  .post(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    fileUploadHandler(),
    async (req, res, next) => {
      try {
        const image = getSingleFilePath(req.files, "image");
        req.body = { image, ...req.body };
        next();
      } catch (error) {
        res.status(400).json({ message: "Failed to upload Category Image" });
      }
    },
    validateRequest(categoryZodValidationSchema),
    CategoryController.createCategory,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.VENDOR),
    CategoryController.getCategories,
  )


router.route('/:id')
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    fileUploadHandler(),
    async (req, res, next) => {
      try {
        const image = getSingleFilePath(req.files, "image");
        req.body = { image, ...req.body };
        next();
      } catch (error) {
        res.status(400).json({ message: "Failed to upload Category Image" });
      }
    },
    CategoryController.updateCategory,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    CategoryController.deleteCategory,
  )

export const CategoryRoutes = router