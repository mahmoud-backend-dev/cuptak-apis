import BadRequest from '../errors/badRequest.js';
import User from '../models/User.js';
import { sanitizeData } from '../utils/sanitizeData.js';
import asyncHandler from 'express-async-handler'
import { StatusCodes } from 'http-status-codes';
import { setPagination } from '../utils/pagination.js';

const isUsedOrNot = async (type, value) => {
  if (type === 'email') {
    const user = await User.findOne({ "email.email": value })
    if (user && user.email[user.email.length - 1].email === value)
      throw new BadRequest(`This email is used, choose anther email`)
  }
  if (type === 'userName') {
    const user = await User.findOne({ 'userName.userName': value })
    if (user && user.userName[user.userName.length - 1].userName === value)
      throw new BadRequest(`This userName is used, choose anther userName `)
  }
  return true
};

export const changeUserData = asyncHandler(async (req, res) => {
  const { email, name, userName, birthday } = req.body;
  const user = await User.findById(req.user._id);
  if (email)
    if (await isUsedOrNot('email', email))
      user.email.push({ email });
  if (name) user.name.push({ name });
  if (userName)
    if (await isUsedOrNot('userName', userName))
      user.userName.push({ userName });
  if (birthday) user.birthday = birthday;

  await user.save();
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
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (! await user.comparePass(req.body.currentPassword))
    throw new BadRequest('Current Password incorrect')

  user.password = req.body.newPassword;
  await user.hashedPass();

  user.passwordChangeAt = Date.now();
  await user.save();
  const token = user.createJWTForAuthorization();

  res.status(StatusCodes.OK)
    .json({
      status: "success",
      message:"Change Password Successfully",
      token,
      user: sanitizeData(user),
    });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { limit, pagination, skip } = await setPagination(User, req);
  const regexPatternUser = req.query.user ? new RegExp(req.query.user, 'i') : /.*/;
  const users = await User.find({
    $or: [
      { 'name.name': { $regex: regexPatternUser } },
      { 'userName.userName': { $regex: regexPatternUser } }
    ]
  }).skip(skip).limit(limit);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Get All Users Successfully',
    count: users.length,
    pagination,
    users
  });
});

export const getAllAdmins = asyncHandler(async (req, res) => {
  let allAdmin = await User.find({}).populate({
    path: 'role',
    select:'permissions'
  });
  allAdmin.forEach((admin) => {
    allAdmin = allAdmin.filter((admin) => admin.role !== null)
  })
  res.status(StatusCodes.OK).json({
    status: "success",
    message:"Get All Admins Successfully",
    count: allAdmin.length,
    allAdmin
  });
});

export const addBan = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.params.id,
    {
      banExpired: new Date(req.body.date),
      isBanned: true
    }
  );
  res.status(StatusCodes.OK)
    .json({
      status: "success",
      message:"Add Ban User Successfully"
    });
});

export const addBanForever = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.params.id,
    {
      banForever: true
    }
  );
  res.status(StatusCodes.OK)
    .json({
      status: "success",
      message:'Add Ban Forever Successfully'
    });
});

export const addRoleUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.body.user },
    { role: req.body.role },
    { new: true, runValidators: true }
  ).populate({
    path: 'role',
    select: 'permissions -_id'
  });
  res.status(StatusCodes.OK).json({
    status: 'success',
    message:'Add Role To User Successfully',
    user: sanitizeData(user)
  });
});

export const removeRoleUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.body.user },
    { role: null },
    { new: true, runValidators: true }
  ).populate({
    path: 'role',
    select: 'permissions -_id'
  });
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Remove Role To User Successfully',
    user: sanitizeData(user)
  });
})

export const deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndRemove(req.params.id);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message:'Delete User Successfully'
  });
});