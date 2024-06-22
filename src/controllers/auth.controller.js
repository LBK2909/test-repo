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
    // check if the user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }
    // create a new organization with the email and name from the request
    const organization = await Organization.create({
      organizationName: req.body.organizationName,
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
    let userId = user._id;
    if (!userId || !tokens) {
      return res.status(400).send({ message: "Invalid credentials" });
    }
    res.cookie("accessToken", tokens, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 86400000),
    });
    res.cookie("userId", user._id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 86400000),
    });
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
  let userId = user._id;
  if (!userId || !tokens) {
    return res.status(400).send({ message: "Invalid credentials" });
  }
  console.log({ tokens });
  res.cookie("accessToken", tokens, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 86400000),
  });
  res.cookie("userId", user._id, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 86400000),
  });
  res.send({ user });
});

exports.googleAuthCallback = async (req, res) => {
  if (!req.user) {
    console.log("user not found...".red.bold.underline);
    res.status(httpStatus.NOT_FOUND).send();
  }
  const token = await tokenService.generateAuthTokens(req.user);

  // const token = jwt.signToken(req.user);
  // Redirect to the frontend with the token (as a query param, in a cookie, etc.)
  // res.redirect(`/your-frontend-route?token=${token}`);
  // let token = "random-token-123456789";
  res.redirect(`${process.env.CLIENT_BASE_URL}/?token=${token}?user=${req.user}`);
};

exports.logout = catchAsync(async (req, res) => {
  // await authService.logout(req.body.refreshToken);
  res.cookie("accessToken", "", {
    httpOnly: true,
    secure: false, // Set to true if running over HTTPS in production
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  // Clear the userId cookie
  res.cookie("userId", "", {
    httpOnly: true,
    secure: false, // Set to true if running over HTTPS in production
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  res.status(200).send("Logged out");
});

exports.shopifyAppVerification = catchAsync(async (req, res) => {
  console.log("shopify app verification...method call...");
  const shop = req.query.shop || null;
  const isCallInitiatedByClientApp = req.query.install || false;

  if (!shop) {
    return res.status(400).send("Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request");
  }
  try {
    const result = await shopifyService.authenticateShop(shop);

    //installation initiated by the client application
    if (isCallInitiatedByClientApp) {
      let newShop = false;
      if (result.newShop) {
        newShop = true;
      }
      res.send({
        url: result.url,
        shop: shop,
        newShop,
      });
    } else {
      //installation initiated by the shopify application
      res.redirect(result.url);
    }
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
