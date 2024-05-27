const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { User, Organization } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");

const CustomError = require("../utils/customError");
exports.organizationList = catchAsync(async (req, res) => {
  const userId =
    req.query?.userId ||
    (() => {
      throw new CustomError(httpStatus.BAD_REQUEST, "User Id is required");
    })();

  // Query the user collection using the userId
  const user = await User.findById(userId);

  // Get the organization list of the user
  const organizationList = user.organizations;

  res.status(httpStatus.CREATED).send({ organizationList });
});

exports.getInstalledShops = catchAsync(async (req, res) => {
  const organizationId =
    req.params?.organizationId ||
    (() => {
      throw new CustomError(httpStatus.BAD_REQUEST, "Organization Id is required");
    })();

  // query the ShopifyShop collection using the organizationId
  const shopList = await Shop.find({ organizationId: organizationId })
    .then((shops) => {
      return shops;
    })
    .catch((error) => {
      throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    });
  // console.log({ shopList });
  res.status(httpStatus.OK).send({ shopList });
});
///connectToOrganization module
exports.connectToOrganization = catchAsync(async (req, res) => {
  try {
    const { organizationId, shop, userId } = req.body;

    // check if the user has the necessary permission to add the store
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError(httpStatus.BAD_REQUEST, "User not found");
    }
    //user permission check
    //check if the user has the necessary information to connect the store
    let userOrganization = user.organizations || [];
    const organizationRole = userOrganization.find((org) => org.organizationId.toString() === organizationId.toString());
    if (!organizationRole || !organizationRole.roles.includes("admin")) {
      throw new CustomError(httpStatus.FORBIDDEN, "User does not have permission to update store");
    }

    console.log("shop name==", shop);

    //get the organizationId & shop from the request
    const existingShop = await ShopifyShop.findOne({ name: shop });
    console.log({ existingShop });
    if (existingShop) {
      if (existingShop.organizationId) {
        throw new CustomError(httpStatus.BAD_REQUEST, "Shop already connected");
      }
      existingShop.organizationId = organizationId;
      await existingShop.save();
      res.status(httpStatus.OK).send("Shop connected successfully");
    } else {
      //shop not found error
      throw new CustomError(httpStatus.NOT_FOUND, "Shop not found");
    }
  } catch (error) {
    console.error(error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send(JSON.stringify({ statusCode: httpStatus.INTERNAL_SERVER_ERROR, message: error.message }));
  }
});

exports.selectOrganization = catchAsync(async (req, res) => {
  const { organizationId } = req.body;
  // Get the user ID from the cookie
  const userId = req.cookies["userId"] || null;
  if (!userId) {
    throw new CustomError(httpStatus.BAD_REQUEST, "User ID is required");
  }

  // Check if the user belongs to the organization
  const user = await User.findById(userId);
  const organizationRole = user.organizations.find((org) => org.organizationId.toString() === organizationId.toString());
  if (!organizationRole) {
    throw new CustomError(httpStatus.FORBIDDEN, "User does not belong to the organization");
  }

  // Set a secure, HttpOnly cookie with the organization ID
  res.cookie("orgId", organizationId, { httpOnly: true, secure: true, sameSite: "Strict", path: "/" });
  res.status(httpStatus.OK).send({ message: "Organization selected successfully." });
});
exports.addNewOrganization = catchAsync(async (req, res) => {
  const { organizationName } = req.body;
  const userId = req.cookies["userId"] || null;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError(httpStatus.BAD_REQUEST, "User not found");
  }

  // Check if the organization name is unique
  const organizationExists = user.organizations.find((org) => org.name === organizationName);
  if (organizationExists) {
    throw new CustomError(httpStatus.BAD_REQUEST, "Organization name already exists");
  }

  const newOrganization = await Organization.create({
    organizationName: req.body.organizationName,
    configurationSetup: true,
    userId: userId,
  });

  newOrganization.save();
  // Create a new organization
  const organization = {
    organizationId: newOrganization._id,
    name: organizationName,
    roles: ["admin"],
  };
  user.organizations.push(organization);
  await user.save();

  const organizationList = user.organizations || [];
  res.status(httpStatus.CREATED).send({ organizationList });
});
exports.verifyUserRole = (req, res, next) => {
  console.log("verifyUserRoles method....");
  next();
};
exports.verifyUserOrganization = (req, res, next) => {
  console.log("verify organization mehtod...");
  next();
};
