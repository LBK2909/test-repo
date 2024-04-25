const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { authService, userService, tokenService, shopifyService } = require("../services");
const { User, Organization } = require("../models");
const CustomError = require("../utils/customError");
const { Shop, ShopifyShop } = require("../models/shop.model");

const mongoose = require("mongoose");
exports.register = catchAsync(async (req, res) => {
  let organizationCreated = null;
  let userCreated = null;
  try {
    // create a new organization with the email and name from the request
    const organization = await Organization.create({
      organizationName: req.body.organizationName,
      email: req.body.email,
      configurationSetup: true,
    });
    //get the organization id from the above created organization
    const organizationId = organization._id;
    organizationCreated = organization;
    //regsiter a new user with the above four fields
    const user = await User.create({
      email: req.body.email,
      password: req.body.password,
      PhoneNumber: req.body.PhoneNumber,
      organizations: [
        {
          organizationId: organizationId,
          name: req.body.organizationName,
          roles: ["admin"],
        },
      ],
    });
    user.save();
    userCreated = user;

    //add the user id to the organization
    organization.userId = user._id;
    organization.save();
    const tokens = await tokenService.generateAuthTokens(user);
    res.send({ user, tokens });
  } catch (error) {
    console.log("Registration failed:", error);
    // If an error occurs, attempt to rollback changes
    if (userCreated) {
      await User.deleteOne({ _id: userCreated._id });
    }
    if (organizationCreated) {
      await Organization.deleteOne({ _id: organizationCreated._id });
    }
    res.status(500).send({ message: "Registration failed, changes were rolled back", error });
  }
  //redirect the user to the signup page
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

exports.shopifyAppVerification = catchAsync(async (req, res) => {
  const shop = req.query.shop || null;
  if (!shop) {
    return res.status(400).send("Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request");
  }

  try {
    const result = await shopifyService.authenticateShop(shop);
    res.redirect(result.url);
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).send(error.message);
  }
});
exports.shopifyAppInstallation = catchAsync(async (req, res) => {
  let { code, shop } = req.query;
  try {
    let result = await shopifyService.installShopifyApp(shop, code);
    res.redirect(result.url);
  } catch (error) {
    console.error("Installation error:", error);
    res.status(500).send(error.message);
  }
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
