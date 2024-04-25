const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { User } = require("../models");
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
    let userOrganization = user.organizations;
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
