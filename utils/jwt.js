const jwt = require("jsonwebtoken");

// const createJWT = function ({ payload }) {
//   return jwt.sign(payload, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_LIFETIME,
//   });
// };

const createJWT = function ({ payload }) {
  return jwt.sign(payload, process.env.JWT_SECRET);
};

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  const accessTokenJWT = createJWT({ payload: { user } });
  const refreshTokenJWT = createJWT({ payload: { user, refreshToken } });

  const oneDay = 1000 * 60 * 60 * 24;
  const longerExp = 1000 * 60 * 60 * 24 * 30;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: false,
    expires: new Date(Date.now() + oneDay),
    secure: process.env.NODE_ENV === "production",
    signed: true,
    // maxAge: 1000,
  });
  res.cookie("refreshToken", refreshTokenJWT, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + longerExp),
  });
};

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
