const UserSchema = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const {
  attachCookiesToResponse,
  createJWT,
  createTokenUser,
  checkPermissions,
} = require("../utils");

const {
  BadRequestError,
  UnauthenticatedError,
  CustomAPIError,
} = require("../errors");

const getAllUsers = async (req, res) => {
  const users = await UserSchema.find({ role: "user" }).select("-password");
  res.status(StatusCodes.OK).json({
    users,
    count: users.length,
  });
};
const getSingleUser = async (req, res) => {
  const user = await UserSchema.findOne({ _id: req.params.id }).select(
    "-password"
  );
  if (!user) {
    throw new CustomAPIError(`No user with id ${req.params.id}`);
  }
  checkPermissions(req.user, user._id);
  res.status(StatusCodes.OK).json({
    user,
  });
};
const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

const updateUser = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    throw new BadRequestError("Please enter all values");
  }
  // const user = await UserSchema.findOneAndUpdate(
  //   { _id: req.user.userId },
  //   { email, name },
  //   { new: true, runValidators: true }
  // );
  const user = await UserSchema.findOne({ _id: req.user.userId });
  user.name = name;
  user.email = email;
  await user.save();
  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({
    user: tokenUser,
  });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new BadRequestError("Please provide both values");
  }
  const user = await UserSchema.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.checkPassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword;
  //update
  await user.save();

  res.status(StatusCodes.OK).json({ msg: `Success! Password Updated.` });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};
