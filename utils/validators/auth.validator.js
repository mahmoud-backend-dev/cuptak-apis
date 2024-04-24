import { body } from 'express-validator';
import BadRequest from '../../errors/badRequest.js';
import validatorMiddleware from '../../middleware/validatorMiddleware.js'

export const signupValidator = [
  body('name').isString().withMessage('name required'),
  body('userName').isString().withMessage('userName required'),
  body('email').isEmail().withMessage('email required and must be valid format'),
  body('password').notEmpty().withMessage('password required')
    .isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('confirmPassword').notEmpty().withMessage('confirmPassword required')
    .custom((val, { req }) => {
      if (val !== req.body.password)
        throw new BadRequest('Password confirmation incorrect')
      return true
    }),
  validatorMiddleware,
];

export const verifyForSignupValidator = [
  body('email').isEmail().withMessage('email required and must be valid format'),
  body('resetCode').isNumeric().withMessage('resetCode required and must be a numeric value'),
  validatorMiddleware,
];

export const forgetPasswordValidator = [
  body('email').notEmpty().withMessage('email required'),
  validatorMiddleware,
];

export const resetPasswordValidator = [
  body('email').notEmpty().withMessage('email required'),
  body('newPassword').notEmpty().withMessage('newPassword required'),
  validatorMiddleware,
];

export const loginValidator = [
  body('email').isEmail().withMessage('email required and must be valid format'),
  body('password').notEmpty().withMessage('password required'),
  validatorMiddleware,
];





