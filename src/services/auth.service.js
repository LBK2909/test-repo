const httpStatus = require("http-status");
const tokenService = require("./token.service");
const userService = require("./user.service");
const Token = require("../models/token.model");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");
const CustomError = require("../utils/customError");
const { User } = require("../models");
const emailService = require("./email.service");
const config = require("../config");
const jwt = require("jsonwebtoken");

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new CustomError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  console.log(user);
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Not found");
  }
  await refreshTokenDoc.remove();
};

// /**
//  * Refresh auth tokens
//  * @param {string} refreshToken
//  * @returns {Promise<Object>}
//  */
// const refreshAuth = async (refreshToken) => {
//   try {
//     const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
//     const user = await userService.getUserById(refreshTokenDoc.user);
//     if (!user) {
//       throw new Error();
//     }
//     await refreshTokenDoc.remove();
//     return tokenService.generateAuthTokens(user);
//   } catch (error) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
//   }
// };

const forgotPassword = async (email) => {
  try {
    const resetLink = await tokenService.generatePasswordResetToken(email);
    console.log({ resetLink });
    await emailService.sendResetPasswordEmail(email, resetLink);
  } catch (err) {
    // console.log(err);
    console.log(typeof err);
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, err.message || "Error in sending reset password email");
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (token, newPassword) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret || null);
    console.log({ decoded });
    const { email, otp } = decoded;
    const verifyToken = await tokenService.verifyPasswordResetToken(email, otp);
    console.log({ verifyToken });
    console.log({ newPassword });
    if (!verifyToken) {
      throw new CustomError(httpStatus.UNAUTHORIZED, "Invalid token");
    }
    // Find the user and update the password
    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError(httpStatus.NOT_FOUND, "User not found");
    }

    user.password = newPassword;
    await user.save();
    return { message: "Password reset successful" };
  } catch (error) {
    console.log(error);
    if (error.name === "TokenExpiredError") {
      throw new CustomError(httpStatus.UNAUTHORIZED, "Token expired. Please request a new password reset.");
    }
    throw new CustomError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

// /**
//  * Verify email
//  * @param {string} verifyEmailToken
//  * @returns {Promise}
//  */
// const verifyEmail = async (verifyEmailToken) => {
//   try {
//     const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
//     const user = await userService.getUserById(verifyEmailTokenDoc.user);
//     if (!user) {
//       throw new Error();
//     }
//     await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
//     await userService.updateUserById(user.id, { isEmailVerified: true });
//   } catch (error) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
//   }
// };

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  resetPassword,
  forgotPassword,
  // refreshAuth,
  // verifyEmail,
};
