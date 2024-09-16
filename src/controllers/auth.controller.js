const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { authService, userService, tokenService, shopifyService, emailService } = require("../services");
const { User, Organization } = require("../models");
const CustomError = require("../utils/customError");
const { Shop, ShopifyShop } = require("../models/shop.model");
const mongoose = require("mongoose");

exports.register = catchAsync(async (req, res) => {
  const requestBody = req.body || null;
  let organizationCreated = null;
  let userCreated = null;
  try {
    // check if the user already exists
    const existingUser = await User.findOne({ email: requestBody?.email });
    if (existingUser) {
      return res.status(400).send({ message: "User already exists" });
    }
    // create a new organization with the email and name from the request
    let organization = await Organization.create({
      organizationName: requestBody?.organizationName,
      configurationSetup: false,
      phoneNumber: requestBody?.phoneNumber,
      isDefault: true,
      billingAddress: {
        country: requestBody?.country,
      },
      isFreeTrial: true,
      orderCount: 50,
    });

    //get the organization id from the above created organization
    const organizationId = organization._id;
    organizationCreated = organization;
    //regsiter a new user with the above four fields
    const user = await User.create({
      email: requestBody?.email,
      password: requestBody?.password,
      isEmailVerified: true,
      organizations: [
        {
          organizationId: organizationId,
          name: requestBody?.organizationName,
          roles: ["admin"],
        },
      ],
    });
    user.save();
    userCreated = user;

    //add the user id to the organization
    organization.userId = user._id;
    organization.save();
    organization = organization.toObject();
    organization.organizationId = organization._id;
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
    res.cookie("orgId", organizationId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 86400000),
    });
    res.send({ user, organization: [organization] });
  } catch (error) {
    console.log("Registration failed:", error);
    // If an error occurs, attempt to rollback changes
    if (userCreated) {
      await User.deleteOne({ _id: userCreated._id });
    }
    if (organizationCreated) {
      await Organization.deleteOne({ _id: organizationCreated._id });
    }
    if (error.code === 11000) {
      const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : null;

      switch (duplicateField) {
        case "organizationName":
          return res.status(400).send({ message: "Organization name already exists. Please choose a different name." });
        default:
          return res.status(400).send({ message: "Duplicate key error. Please check your input." });
      }
    }

    res.status(500).send({ message: "Internal server error", error: error.message });
  }
  //redirect the user to the signup page
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  let user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  let userId = user._id;
  if (!userId || !tokens) {
    return res.status(400).send({ message: "Invalid credentials" });
  }

  // Fetch organization details for each organization the user is part of
  const organizations = await Promise.all(
    user.organizations.map(async (org) => {
      org = org.toObject();
      const organizationDetails = await Organization.findOne({ _id: org.organizationId }).select(
        " -updatedAt -__v -configurationSetup"
      );
      // console.log({ organizationDetails });
      let obj = {
        ...org,
        ...organizationDetails.toObject(),
      };
      return obj;
    })
  );
  // Remove the user's password from the response
  user.password = undefined;

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
  let currentOrganizationId = organizations.find((org) => org.isDefault)?.organizationId;
  res.cookie("orgId", currentOrganizationId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + 86400000),
  });
  res.send({ user, organizations, currentOrganizationId });
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
  // Clear the userId cookie
  res.cookie("orgId", "", {
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

exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(200).send({ message: "Email already exists", isAvailable: false });
    }

    res.status(200).send({ message: "Email is available", isAvailable: true });
  } catch (error) {
    res.status(500).send({ message: "Internal server error", error: error.message });
  }
};
exports.sendVerificationEmail = catchAsync(async (req, res) => {
  let email = req.body?.email;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(email);
  // await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(200).send(verifyEmailToken);
});
exports.verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).send({ message: "Email or OTP are required" });
  }
  const isVerified = await tokenService.verifyOTP(email, otp);
  if (!isVerified) {
    return res.status(400).send({ message: "Invalid OTP" });
  }
  res.status(200).send({ message: "OTP verified" });
});
// const refreshTokens = catchAsync(async (req, res) => {
//   const tokens = await authService.refreshAuth(req.body.refreshToken);
//   res.send({ ...tokens });
// });

exports.forgotPassword = catchAsync(async (req, res) => {
  let email = req.query?.email;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }
  await authService.forgotPassword(email);
  res.status(httpStatus.NO_CONTENT).send();
});

exports.resetPassword = catchAsync(async (req, res) => {
  let { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).send({ message: "Token and new password are required" });
  }
  let response = await authService.resetPassword(token, newPassword);
  res.status(200).send(response);
});

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
