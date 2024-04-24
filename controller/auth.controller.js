import fs from 'fs';
import hbs from 'handlebars';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import BadRequest from '../errors/badRequest.js';
import CustomErrorAPI from '../errors/customErrorAPI.js';
import sendEmail from '../utils/sendEmail.js';
import { StatusCodes } from 'http-status-codes';
import NotFound from '../errors/notFound.js';
import { sanitizeData } from '../utils/sanitizeData.js';
import Role from '../models/Role.js'
const sourceSignup = fs.readFileSync('templates/confirmMail.hbs', 'utf-8');
const templateForSignup = hbs.compile(sourceSignup);
const sourcePassword = fs.readFileSync('templates/resetPassword.hbs', 'utf-8');
const templateForPassword = hbs.compile(sourcePassword);

export const allowTo = (...roles) => asyncHandler(async (req, res, next) => {
  if (req.user.role == null && roles.includes('user'))
    return next();
  if (req.user.role == null)
    throw new UnauthenticatedError('You are not allowed to access this route');
  const sharedElements = roles.filter((ele) => req.user.role.permissions.includes(ele));
  if (sharedElements.length == 0)
    throw new UnauthenticatedError('You are not allowed to access this route')
  next();
});

const trySendEmail = async (mailOpts, resetCode, user, template, type) => {
  try {
    await sendEmail(mailOpts, template({
      name: user.name[user.name.length - 1].name,
      ResetCode: resetCode
    }));
    if (type === 'R')
      await user.hashedPass()
    await user.save();
  } catch (error) {
    if (type === 'R')
      await user.deleteOne()
    else {
      user.resetCodeExpiredForPassword = undefined;
      user.resetVerifyForPassword = undefined;
    }
    throw new CustomErrorAPI('There is an error in sending email', StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

const checkBanUserOrNot = async (user) => {
  if (user.banForever)
    throw new BadRequest(`This email was taken ban forever`);
  if (user.isBanned) {
    if (user.banExpired > Date.now())
      throw new BadRequest(`This email was taken ban please wait to expired this ban`)
    else {
      user.banExpired = undefined;
      user.isBanned = false;
      await user.save()
    }
  }
};

export const signup = asyncHandler(async (req, res) => {
  let user = await User.findOne({ "email.email": req.body.email });
  const resetCode = Math.floor(Math.random() * 900000)
  if (user && user.email[user.email.length - 1].email === req.body.email) {
    await checkBanUserOrNot(user)
    if (user.resetCodeExpiredForSignup > Date.now())
      throw new BadRequest(`Your Account Not Verified check your gmail`)
    if (user.resetVerifyForSignup === true && user.email[0].email === req.body.email)
      throw new BadRequest(`This email already user, choose anther email`)
    user.name[0].name = req.body.name;
    user.name[0].date = new Date(Date.now());
    user.userName[0].userName = req.body.userName;
    user.userName[0].date = new Date(Date.now());
    user.email[0].email = req.body.email;
    user.email[0].date = new Date(Date.now());
    user.password = req.body.password;
    user.resetCodeForSignup = resetCode;
    user.resetCodeExpiredForSignup = Date.now() + 10 * 60 * 1000;
    const mailOpts = {
      to: user.email[user.email.length - 1].email,
      subject: 'Verification Your Account (valid for 10 minutes)'
    };
    await trySendEmail(mailOpts, resetCode, user, templateForSignup, 'R');
    return res.status(StatusCodes.CREATED).json({ status: "Success" });
  }
  user = await User.create({
    name: [{ name: req.body.name, date: new Date(Date.now()) }],
    userName: [{ userName: req.body.userName, date: new Date() }],
    email: [{ email: req.body.email, date: new Date() }],
    password: req.body.password,
    resetCodeForSignup: resetCode,
    resetCodeExpiredForSignup: new Date(Date.now() + 10 * 60 * 1000),
  });
  const mailOpts = {
    to: user.email[user.email.length - 1].email,
    subject: 'Verification Your Account (valid for 10 minutes)'
  };

  await trySendEmail(mailOpts, resetCode, user, templateForSignup, 'R');
  return res.status(StatusCodes.CREATED).json({ status: "Success" });
});

export const verifySignup = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    "email.email": req.body.email,
    resetCodeForSignup: req.body.resetCode,
    resetCodeExpiredForSignup: { $gt: Date.now() }
  }).populate({
    path: 'role',
    select: 'permissions'
  });
  if (!user || user.email[user.email.length - 1].email !== req.body.email)
    throw new BadRequest(`Reset code invalid or expired or email`)
  user.resetVerifyForSignup = true;
  user.resetCodeExpiredForSignup = undefined;
  await user.save()
  const token = user.createJWTForAuthorization();
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Verification Account Successfully',
    token,
    user: sanitizeData(user),
  })
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    email: { $elemMatch: { email: req.body.email } }
  }).populate({
    path: 'role',
    select: 'permissions'
  });
  if (!user || user.email[user.email.length - 1].email !== req.body.email)
    throw new NotFound(`Email not found`)
  if (!await user.comparePass(req.body.password))
    throw new BadRequest(`Password Invalid`)
  await checkBanUserOrNot(user)
  if (user.resetVerifyForSignup === false)
    throw new BadRequest(`Your Account Not Verified`);
  const token = user.createJWTForAuthorization();
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Login Successfully',
    token,
    user: sanitizeData(user),
  })
});

export const forgetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ "email.email": req.body.email });
  const resetCode = Math.floor(Math.random() * 900000)
  if (!user || user.email[user.email.length - 1].email !== req.body.email)
    throw new NotFound(`Email not found`)
  await checkBanUserOrNot(user)
  if (user.resetVerifyForSignup === false)
    throw new BadRequest('Your Account not verify');
  user.resetCodeExpiredForPassword = Date.now() + 10 * 60 * 1000;
  user.resetVerifyForPassword = false;
  const mailOpts = {
    to: user.email[user.email.length - 1].email,
    subject: 'Verification For Reset Password (valid for 10 minutes)'
  };
  await trySendEmail(mailOpts, resetCode, user, templateForPassword, 'F');
  res.status(StatusCodes.OK).json({ status: "Success" });
});

export const verifyPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    "email.email": req.body.email,
    resetCodeForPassword: req.body.resetCode,
    resetCodeExpiredForPassword: { $gt: Date.now() }
  });
  if (!user || user.email[user.email.length - 1].email !== req.body.email)
    throw new BadRequest(`Reset code invalid or expired or email`)
  await checkBanUserOrNot(user);
  user.resetVerifyForPassword = true;
  user.resetCodeExpiredForPassword = undefined;
  await user.save();
  res.status(StatusCodes.OK).json({ status: "Success", user: sanitizeData(user) });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    email: { $elemMatch: { email: req.body.email } }
  }).populate({
    path: 'role',
    select: 'permissions'
  });
  if (!user || user.email[user.email.length - 1].email !== req.body.email)
    throw new NotFound(`Email not found`)
  if (user.resetVerifyForPassword === false)
    throw new BadRequest(`Not Verified`)
  await checkBanUserOrNot(user);
  user.password = req.body.password;
  await user.hashedPass();
  await user.save();
  const token = user.createJWTForAuthorization();
  res.status(StatusCodes.OK).json({ token, data: sanitizeData(user) });
});

export const changeUserData = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { email: req.body.email },
      $addToSet: { userName: req.body.userName },
      $addToSet: { name: req.body.name },
      birthday: req.body.birthday,
    },
    { new: true }
  );
  if (req.file) {
    const image = `${process.env.BASE_URL}/users/${req.file.filename}`
    user.image = image;
    await user.save()
  };
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Update User Info Successfully',
    user: sanitizeData(user)
  })
})