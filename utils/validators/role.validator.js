import { body, param } from 'express-validator';
import BadRequest from '../../errors/badRequest.js';
import validatorMiddleware from '../../middleware/validatorMiddleware.js'
import Role from '../../models/Role.js';
import NotFoundError from '../../errors/notFound.js';
import User from '../../models/User.js';

export const addRoleValidator = [
  body('name').notEmpty().withMessage('role required'),
  body('permissions').notEmpty().withMessage('permissions required')
    .custom(async (val, { req }) => {
      const arrOfRoles = [
        'manage videos',
        'manage sounds',
        'manage hashtags',
        'manage reports',
        'manage gifts',
        'manage categories',
        'manage wallet',
        'manage roles',
        'manage users'
      ];
      if (val.filter((ele) => arrOfRoles.includes(ele)).length !== val.length)
        throw new BadRequest(`permissions must be manage videos,
                                                  manage sounds,
                                                  manage hashtags,
                                                  manage reports,
                                                  manage gifts,
                                                  manage categories,
                                                  manage wallet,
                                                  manage roles,
                                                  manage users`
        );
      return true;
    }),
  validatorMiddleware
];

export const updateRoleValidator = [
  param('id')
    .custom(async (val, { req }) => {
      const role = await Role.findById(val);
      if (!role)
        throw new NotFoundError(`No role for this id: ${val}`)
      return true;
    }),
  validatorMiddleware,
];

export const removeRoleValidator = [
  param('id')
    .custom(async (val) => {
      const role = await Role.findById(val);
      if (!role)
        throw new NotFoundError(`No role for this id: ${val}`)
      if (role.permissions.includes('admin') || role.permissions.includes('owner'))
        throw new BadRequest('You are not allow to remove this role')
      return true
    }),
  validatorMiddleware,
];

export const addAdminRoleValidator = [
  param('id')
    .custom(async (val) => {
      const user = await User.findById(val);
      if (!user)
        throw new NotFoundError(`No user for this id: ${val}`)
      return true;
    }),
  validatorMiddleware,
];

export const removeAdminRoleValidator = [
  param('id')
    .custom(async (val) => {
      const user = await User.findById(val).populate({
        path: 'role',
        select: 'permissions _id'
      });
      if (!user)
        throw new NotFoundError(`No user for this id: ${val}`)
      if (!user.role.permissions.includes('admin'))
        throw new BadRequest('This user not admin')
      await Role.findByIdAndRemove(user.role._id);
      return true;
    }),
  validatorMiddleware,
];

export const addOwnerRoleValidator = [
  param('id')
    .custom(async (val) => {
      const user = await User.findById(val);
      if (!user)
        throw new NotFoundError(`No user for this id: ${val}`)
      return true;
    }),
  validatorMiddleware,
];

export const removeOwnerRoleValidator = [
  param('id')
    .custom(async (val) => {
      const user = await User.findById(val).populate({
        path: 'role',
        select: 'permissions _id'
      });
      if (!user)
        throw new NotFoundError(`No user for this id: ${val}`)
      if (!user.role.permissions.includes('owner'))
        throw new BadRequest('This user not owner')
      await Role.findByIdAndRemove(user.role._id);
      return true;
    }),
  validatorMiddleware,
];