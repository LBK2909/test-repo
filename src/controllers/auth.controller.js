const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { authService, userService, tokenService, emailService } = require("../services");
const { User } = require("../models");

const mongoose = require("mongoose");
exports.register = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await userService.createUser(req.body, session);
    console.log("user....", user);
    const tenant = await userService.createTenant(user, session);
    console.log({ tenant });
    // const tokens = await tokenService.generateAuthTokens(user);
    let updateUser = await User.findById(user._id).session(session);
    updateUser.tenantId = tenant._id;
    await updateUser.save({ session });
    // let updateUser = await userService.updateUserById(user._id, { tenantId: tenant._id });
    await session.commitTransaction();
    session.endSession();
    // res.status(httpStatus.CREATED).send({ user, tokens });
  } catch (error) {
    console.log("error....", error);
    await session.abortTransaction();
    session.endSession();
  }
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

exports.googleAuthCallback = async (req, res) => {
  if (!req.user) {
    console.log("user not found...".red.bold.underline);
    res.status(httpStatus.NOT_FOUND).send();

    // return res.redirect("http://localhost:5173/login?token=invalid");
  }
  const token = await tokenService.generateAuthTokens(req.user);

  // const token = jwt.signToken(req.user);
  // Redirect to the frontend with the token (as a query param, in a cookie, etc.)
  // res.redirect(`/your-frontend-route?token=${token}`);
  // let token = "random-token-123456789";
  res.redirect(`${process.env.CLIENT_SERVER_URL}/?token=${token}?user=${req.user}`);
};

exports.logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

// const refreshTokens = catchAsync(async (req, res) => {
//   const tokens = await authService.refreshAuth(req.body.refreshToken);
//   res.send({ ...tokens });
// });

// const forgotPassword = catchAsync(async (req, res) => {
//   const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
//   await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
//   res.status(httpStatus.NO_CONTENT).send();
// });

// const resetPassword = catchAsync(async (req, res) => {
//   await authService.resetPassword(req.query.token, req.body.password);
//   res.status(httpStatus.NO_CONTENT).send();
// });

// const sendVerificationEmail = catchAsync(async (req, res) => {
//   const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
//   await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
//   res.status(httpStatus.NO_CONTENT).send();
// });

// const verifyEmail = catchAsync(async (req, res) => {
//   await authService.verifyEmail(req.query.token);
//   res.status(httpStatus.NO_CONTENT).send();
// });

// module.exports = {
//   // register,
//   login,
//   logout,
//   // refreshTokens,
//   // forgotPassword,
//   // resetPassword,
//   // sendVerificationEmail,
//   // verifyEmail,
// };
