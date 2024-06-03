const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { Courier, OrganizationCourier } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");

const CustomError = require("../utils/customError");

exports.getCouriers = catchAsync(async (req, res) => {
  // Logic to fetch the list of couriers
  let couriersList = await Courier.find({}, { name: 1, imageUrl: 1, description: 1 });
  res.status(httpStatus.OK).json(couriersList);
  // res.send("couriers list");
});
exports.getCouriersByOrganization = catchAsync(async (req, res) => {
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  const courierList = await OrganizationCourier.find({ organizationId }).populate("courierId");
  res.status(httpStatus.OK).send(courierList);
});
exports.getCourierByOrganization = catchAsync(async (req, res) => {
  let id = req.params.id;
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  const courier = await OrganizationCourier.findById(id).populate("courierId");
  res.status(httpStatus.OK).send(courier);
});
exports.addCourier = catchAsync(async (req, res) => {
  // Logic to add a new courier
  const { name, description, credentials, imageUrl } = req.body;
  const courier = new Courier({ name, description, credentials, imageUrl });
  await courier.save();
  res.status(httpStatus.CREATED).json({ message: "Courier added successfully", courier });
  res.send("add couriers");
});

exports.getCourier = catchAsync(async (req, res) => {
  res.send("get courier method..");
  const courierId = req.params.id;
  const courier = await Courier.findById(courierId);
  if (!courier) {
    throw new CustomError(httpStatus.NOT_FOUND, "Courier not found");
  }
  res.status(httpStatus.OK).json({ courier });
});
