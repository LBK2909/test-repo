const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { User, Organization, Courier, OrganizationCourier } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");
const CustomError = require("../utils/customError");

exports.createOrganization = async (userId, organizationData) => {
  const { organizationName, displayName, phoneNumber, billingAddress, companyLogo } = organizationData;

  // Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError(httpStatus.NOT_FOUND, "User not found");
  }

  // Check if the organization name is unique
  const organizationExists = user.organizations.find((org) => org.name === organizationName);
  if (organizationExists) {
    throw new CustomError(httpStatus.CONFLICT, "Organization name already exists");
  }

  const newOrganization = new Organization({
    organizationName,
    displayName,
    phoneNumber,
    configurationSetup: true,
    userId,
    billingAddress,
    companyLogo,
  });

  await newOrganization.save();

  // Update user's organization list
  const organization = {
    organizationId: newOrganization._id,
    name: organizationName,
    roles: ["admin"],
  };
  user.organizations.push(organization);
  await user.save();

  return user.organizations;
};
