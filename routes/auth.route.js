import { Router } from "express";
const router = Router();

import {
  signupValidator,
  verifyForSignupValidator,
  loginValidator,
  forgetPasswordValidator,
  resetPasswordValidator,
} from "../utils/validators/auth.validator.js";

import {
  signup,
  verifySignup,
  login,
  forgetPassword,
  verifyPassword,
  resetPassword,
} from "../controller/auth.controller.js";
import passport from "passport";



router.get(
  '/google',
  passport.authenticate(
    'google',
    {
      scope: ['email', 'profile']
    })
);

router.get('/google/callback', passport.authenticate('google'), (req, res) => {
  res.status(200).json({ ...req.user });
});

router.post('/signup', signupValidator, signup);
router.post('/verify-signup', verifyForSignupValidator, verifySignup);
router.post('/forget-password', forgetPasswordValidator, forgetPassword);
router.post('/verify-password', verifyForSignupValidator, verifyPassword);
router.patch('/reset-password', resetPasswordValidator, resetPassword);
router.post('/login', loginValidator, login);

export default router;