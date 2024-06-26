const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { Courier, OrganizationCourier } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");
const CustomError = require("../utils/customError");
const mongoose = require("mongoose");
const { courierService } = require("../services");

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
  const { name, description, credentials, imageUrl, shippingModes, endpoints } = req.body;
  const courier = new Courier({ name, description, credentials, imageUrl, shippingModes, endpoints });
  await courier.save();
  res.status(httpStatus.CREATED).json({ message: "Courier added successfully", courier });
  res.send("add couriers");
});

exports.getCourier = catchAsync(async (req, res) => {
  const courierId = req.params.id;
  const courier = await Courier.findById(courierId);
  if (!courier) {
    throw new CustomError(httpStatus.NOT_FOUND, "Courier not found");
  }
  res.status(httpStatus.OK).json(courier);
});

exports.updateCourier = catchAsync(async (req, res) => {
  const courierId = req.params.id;
  const updateData = req.body;

  try {
    // Validate the update data as needed (this is just an example)
    if (!updateData) {
      return res.status(400).json({ message: "Invalid data" });
    }

    // Find and update the courier configuration with the given key-value pairs
    const updatedCourier = await Courier.findByIdAndUpdate(courierId, { $set: updateData }, { new: true, runValidators: true });

    if (!updatedCourier) {
      return res.status(404).json({ message: "Courier not found" });
    }

    res.json(updatedCourier);
  } catch (error) {
    console.error("Error updating courier:", error);
    res.status(500).json({ message: "Server error" });
  }
});
exports.updateOrganizationCourier = catchAsync(async (req, res) => {
  const { id } = req.params;
  const obj = req.body || {};

  const updatedCourier = await courierService.updateOrganizationCourier(id, obj);

  if (!updatedCourier) {
    return res.status(404).json({ message: "Courier not found" });
  }

  res.status(200).json(updatedCourier);
});

exports.removeOrganizationCourier = catchAsync(async (req, res) => {
  const { id } = req.params;

  const deletedCourier = await courierService.removeOrganizationCourier(id);

  if (!deletedCourier) {
    return res.status(404).json({ message: "Courier not found" });
  }

  res.status(200).json({ message: "Courier deleted successfully" });
});
