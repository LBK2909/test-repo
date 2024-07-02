const jwt = require("jsonwebtoken");
const moment = require("moment");
const httpStatus = require("http-status");
const config = require("../config");
const userService = require("./user.service");
const { Token, OTP } = require("../models");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/tokens");
const emailService = require("./email.service");
const CustomError = require("../utils/customError");
const { OTP_TYPES } = require("../utils/constants");
/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
// const saveToken = async (token, userId, expires, type, blacklisted = false) => {
//   const tokenDoc = await Token.create({
//     token,
//     user: userId,
//     expires: expires.toDate(),
//     type,
//     blacklisted,
//   });
//   return tokenDoc;
// };

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationDays, "days");
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, "days");
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  // await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);
  return accessToken;
};
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (email) => {
  // Check if email OTP already exists in the collection
  try {
    const verificationType = OTP_TYPES.EMAIL_VERIFICATION;
    const existingOTP = await OTP.findOne({ email, type: verificationType });
    if (existingOTP) {
      // Remove the old OTP
      await OTP.findByIdAndDelete(existingOTP._id);
    }
    // Save new OTP to the database

    const otp = generateVerificationCode();
    const expirationTime = new Date(Date.now() + 10 * 60000); // OTP valid for 10 minutes

    // Save OTP to the database
    await OTP.create({ email, otp, type: verificationType, expirationTime });

    // Send OTP to the user's email
    let emailResponse = await emailService.sendVerificationEmail(email, otp);
    if (emailResponse) {
      return { message: "Verification code sent successfully" };
    } else {
      throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error sending verification code");
    }
  } catch (err) {
    console.log(err);
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error generating OTP");
  }
};
const verifyOTP = async (email, otp) => {
  try {
    const verificationType = OTP_TYPES.EMAIL_VERIFICATION;

    const existingOTP = await OTP.findOne({ email, type: verificationType });
    if (!existingOTP || existingOTP.otp !== otp) {
      throw new CustomError(httpStatus.BAD_REQUEST, "Invalid OTP");
    }
    if (new Date() > existingOTP.expirationTime) {
      throw new CustomError(httpStatus.BAD_REQUEST, "OTP expired");
    }
    await OTP.findByIdAndDelete(existingOTP._id);

    return true;
  } catch (err) {
    console.log(err);
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, err);
  }
};

const generatePasswordResetToken = async (email) => {
  try {
    const userExists = await userService.getUserByEmail(email);
    if (!userExists) {
      throw new CustomError(httpStatus.NOT_FOUND, "User not exists");
    }
    const verType = OTP_TYPES.PASSWORD_RESET;
    const JWT_SECRET = config.jwt.secret;
    const existingOTP = await OTP.findOne({ email, type: verType });
    if (existingOTP) {
      if (moment(existingOTP.expirationTime).isAfter(moment())) {
        // If OTP exists and is not expired
        throw new CustomError(httpStatus.BAD_REQUEST, "A password reset link has already been sent to your email.");
      } else {
        // If OTP exists but is expired, remove it
        await OTP.findByIdAndDelete(existingOTP._id);
      }
    }

    const otp = generateVerificationCode();
    const expirationTime = moment().add(10, "minutes").toDate();

    const newOTP = new OTP({
      email,
      otp,
      expirationTime,
      type: verType,
    });

    await newOTP.save();

    const token = jwt.sign({ email, otp }, JWT_SECRET, { expiresIn: "10m" }); // JWT valid for 10 minutes
    const resetLink = `${process.env.CLIENT_BASE_URL}/reset-password?token=${token}`;
    return resetLink;
  } catch (error) {
    console.error("Error generating password reset token:", error);
    throw error;
  }
};

const verifyPasswordResetToken = async (email, otp) => {
  try {
    const verificationType = OTP_TYPES.PASSWORD_RESET;
    const otpRecord = await OTP.findOne({ email, otp, type: verificationType });

    if (!otpRecord || otpRecord.expirationTime < new Date()) {
      return false;
    }

    // Invalidate the OTP
    await OTP.findByIdAndDelete(otpRecord._id);

    return true;
  } catch (error) {
    console.error("Error verifying password reset token:", error);
    return false;
  }
};
module.exports = {
  generateToken,
  // saveToken,
  verifyToken,
  generateAuthTokens,
  generateVerificationCode,
  generateVerifyEmailToken,
  verifyOTP,
  generatePasswordResetToken,
  verifyPasswordResetToken,
};
