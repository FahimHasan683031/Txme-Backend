// wallet.route.ts
import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { WalletController } from "./wallet.controller";

const router = express.Router();

router.post("/topup", auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR), WalletController.topUp);
router.post("/send", auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR), WalletController.sendMoney);
router.post("/withdraw", auth(USER_ROLES.CUSTOMER, USER_ROLES.VENDOR), WalletController.withdraw);

export const WalletRoutes = router;
