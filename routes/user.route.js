import { Router } from "express";
const router = Router();

import protectRoute from '../middleware/authMiddleware.js';
import { uploadSingleFile } from '../middleware/uploadFileMiddleWare.js';
import { allowTo } from '../controller/auth.controller.js';
import {
  addBan,
  addBanForever,
  addRoleUser,
  changePassword,
  changeUserData,
  deleteUser,
  getAllAdmins,
  getAllUsers,
  removeRoleUser
} from "../controller/user.controller.js";
import {
  addBanTimeValidator,
  addRoleUserValidator,
  banUserValidator,
  changePasswordValidator,
  deleteSpecificUserValidator,
  removeRoleUserValidator
} from "../utils/validators/user.validator.js"; 

router.patch('/changePassword', protectRoute, changePasswordValidator, changePassword);

router.patch(
  '/change-user-info',
  protectRoute,
  uploadSingleFile('image', 'users', 'image'),
  changeUserData
);

router.get(
  '/all',
  protectRoute,
  allowTo('owner', 'admin','manage users','manage roles'),
  getAllUsers
);

router.get('/all/admin', protectRoute, allowTo('owner', 'admin'), getAllAdmins);

router.post(
  '/add/ban/:id',
  protectRoute,
  allowTo('owner', 'admin', 'manage user'),
  addBanTimeValidator,
  addBan
);

router.post(
  '/add/ban/forever/:id',
  protectRoute,
  allowTo('owner', 'admin', 'manage user'),
  banUserValidator,
  addBanForever
);

router.post(
  '/add/role',
  protectRoute,
  allowTo('owner', 'admin', 'manage roles'),
  addRoleUserValidator,
  addRoleUser
);

router.patch(
  '/remove/role',
  protectRoute,
  allowTo('owner', 'admin', 'manage roles'),
  removeRoleUserValidator,
  removeRoleUser
)

router.delete(
  '/one/:id',
  protectRoute,
  allowTo('owner', 'admin', 'manage users'),
  deleteSpecificUserValidator,
  deleteUser
)
export default router