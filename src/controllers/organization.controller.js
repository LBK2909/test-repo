const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { User, Organization, Courier, OrganizationCourier } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");
const CustomError = require("../utils/customError");
const organizationService = require("../services/organization.service");

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
    .select("-accessToken")
    .then((shops) => {
      return shops;
    })
    .catch((error) => {
      throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
    });
  // console.log({ shopList });
  res.status(httpStatus.OK).send(shopList);
});
///connectToOrganization module
exports.connectToOrganization = catchAsync(async (req, res) => {
  try {
    const { shop, organizationId } = req.body;
    const userId = req.cookies["userId"] || null;
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
    const existingShop = await ShopifyShop.findOne({ storeUrl: shop });
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
  const userId = req.cookies["userId"] || null;
  const organizationData = req.body;
  const organizationList = await organizationService.createOrganization(userId, organizationData);
  res.status(httpStatus.CREATED).send({ organizationList });
});

exports.connectCourierToOrganization = catchAsync(async (req, res) => {
  const { name, courierId, credentials, selectedShippingModes, isProductionEnvironment } = req.body;
  console.log("courierId==", courierId);
  console.log("credentials==", credentials);
  // return;
  try {
    let organizationId = parseInt(req.cookies["orgId"]) || null;
    if (!organizationId) {
      throw new CustomError(httpStatus.BAD_REQUEST, "Organization ID is required");
    }

    const orgCourier = await connectCourier(
      organizationId,
      courierId,
      credentials,
      name,
      selectedShippingModes,
      isProductionEnvironment
    );
    res.status(httpStatus.OK).send(orgCourier);
  } catch (error) {
    console.error(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: error.message });
  }
});
async function connectCourier(organizationId, courierId, credentials, name, selectedShippingModes, isProductionEnvironment) {
  try {
    // Find the courier to get the required credentials
    const courier = await Courier.findById(courierId);
    if (!courier) throw new Error("Courier not found");

    // Construct the credentials map
    const credentialsObj = {};
    courier.credentials.forEach((key) => {
      if (credentials.hasOwnProperty(key)) {
        credentialsObj[key] = credentials[key];
      } else {
        throw new Error(`Credential ${key} is required but not provided`);
      }
    });

    // Create the organization-courier connection
    const orgCourier = new OrganizationCourier({
      organizationId,
      courierId,
      isActive: true,
      credentials: credentialsObj,
      name,
      selectedShippingModes,
      isProductionEnvironment,
    });

    await orgCourier.save();
    return orgCourier;
  } catch (error) {
    console.error("Failed to connect courier to organization:", error);
    throw error;
  }
}

exports.getOrganization = catchAsync(async (req, res) => {
  const userId = req.cookies["userId"];
  const organizationId = req.cookies["orgId"];
  const organization = await Organization.findOne({ _id: organizationId }).select("-createdAt -updatedAt -configurationSetup");
  res.status(httpStatus.OK).send(organization);
});
exports.updateOrganization = catchAsync(async (req, res) => {
  const organizationId = req.cookies["orgId"];
  const update = req.body;

  const organization = await Organization.findByIdAndUpdate(organizationId, update, { new: true });
  res.status(httpStatus.OK).send(organization);
});
exports.deleteOrganization = catchAsync(async (req, res) => {
  const organizationId = req.cookies["orgId"];
  await Organization.findByIdAndDelete(organizationId);
  res.status(httpStatus.OK).send("Organization deleted successfully");
});
exports.verifyUserRole = (req, res, next) => {
  console.log("verifyUserRoles method....");
  next();
};
exports.verifyUserOrganization = (req, res, next) => {
  console.log("verify organization mehtod...");
  next();
};
