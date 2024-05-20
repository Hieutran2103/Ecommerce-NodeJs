const UserSchema = require("../models/User");
const Token = require("../models/Token");

const { StatusCodes } = require("http-status-codes");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils");
const crypto = require("crypto");

const {
  BadRequestError,
  UnauthenticatedError,
  CustomAPIError,
} = require("../errors");

const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  const emailAlreadyExists = await UserSchema.findOne({ email });
  if (emailAlreadyExists) {
    throw new BadRequestError("Email already exists");
  }

  if (!name || !email || !password) {
    throw new BadRequestError("Please provide name , email or password");
  }
  const isFirstAccount = (await UserSchema.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  //verify
  const verificationToken = crypto.randomBytes(40).toString("hex");

  const user = await UserSchema.create({
    name,
    email,
    password,
    role,
    verificationToken,
  });
  // const tokenUser = createTokenUser(user);
  // attachCookiesToResponse({ res, user: tokenUser });
  // res.status(StatusCodes.CREATED).json({
  //   user: tokenUser,
  // });

  // Lấy URL của Frontend (FE) khi một yêu cầu đi qua các proxy hoặc máy chủ trung gian
  // const origin = "http://localhost:3000";
  // const protocol = req.protocol;
  // const forwardedHost = req.get("x-forwarded-host");

  console.log(req.get("origin"));
  // const origin = `${protocol}://${forwardedHost}`;
  const origin = req.get("origin");
  // console.log(origin);

  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Sucessfully created! Check your email to verify your account",
  });
};

//Verify email

const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;

  const user = await UserSchema.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError("Verification failed");
  }
  if (user.verificationToken !== verificationToken) {
    throw new UnauthenticatedError("Verification failed");
  }

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = "";

  await user.save();

  res.status(StatusCodes.OK).json({ msg: "Email verified" });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Please provide name , email or password");
  }
  // check email
  const user = await UserSchema.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
  }
  // hash password
  const isPasswordCorrect = await user.checkPassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Password not true");
  }

  //verify
  if (!user.isVerified) {
    throw new UnauthenticatedError("Please verify your email");
  }

  const tokenUser = createTokenUser(user);

  // create refresh token
  let refreshToken = "";
  //=============check for existing token
  //======== bước nay la nhung lan dang nhap lai no se khong tao ra them Tokenschema để tiết kiệm bộ nhớ
  const existingToken = await Token.findOne({ user: user._id });
  if (existingToken) {
    const { isValid } = existingToken;
    if (!isValid) {
      throw new UnauthenticatedError("Invalid Credentials");
    }
    refreshToken = existingToken.refreshToken;
    attachCookiesToResponse({ res, user: tokenUser, refreshToken });
    res.status(StatusCodes.OK).json({
      user: tokenUser,
    });
    return;
  }

  ////======== bước nay la lần đăng nhập đầu tiên
  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const userToken = { refreshToken, userAgent, ip, user: user._id };
  await Token.create(userToken);
  attachCookiesToResponse({ res, user: tokenUser, refreshToken });
  res.status(StatusCodes.OK).json({
    user: tokenUser,
  });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.status(StatusCodes.OK).json({
    msg: "user logged out successfully",
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError("Please provide email");
  }
  const user = await UserSchema.findOne({ email });
  if (!user) {
    throw new BadRequestError("Please provide valid email");
  }
  const passwordToken = crypto.randomBytes(70).toString("hex");
  // send email
  // const protocol = req.protocol;
  // const forwardedHost = req.get("x-forwarded-host");
  // const origin = `${protocol}://${forwardedHost}`;

  const origin = req.get("origin");

  await sendResetPasswordEmail({
    name: user.name,
    email: user.email,
    token: passwordToken,
    origin: origin,
  });

  const tenMinutes = 1000 * 60 * 10;
  const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

  user.passwordToken = passwordToken;
  user.passwordTokenExpirationDate = passwordTokenExpirationDate;

  await user.save();

  res.status(StatusCodes.OK).json({
    msg: "Please check your email for reset password link",
  });
};

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;

  if (!email || !password || !token) {
    throw new BadRequestError("Please provide all values");
  }
  const user = await UserSchema.findOne({ email });
  if (user) {
    const currentDate = new Date();

    if (
      user.passwordToken === token &&
      user.passwordTokenExpirationDate > currentDate
    ) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;
      await user.save();
    }
  }
  res.send("reset password");
};

module.exports = {
  login,
  logout,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
