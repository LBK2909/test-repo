const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const boxService = require("../services/config/box.service");

exports.createBox = catchAsync(async (req, res) => {
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  if (!organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization ID is required" });
  }

  const boxData = { ...req.body, orgId: organizationId };
  const box = await boxService.createBox(boxData);
  res.status(httpStatus.CREATED).send(box);
});

exports.getBoxes = catchAsync(async (req, res) => {
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  if (!organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization ID is required" });
  }

  const boxes = await boxService.getBoxes(organizationId);
  res.status(httpStatus.OK).send(boxes);
});

exports.getBoxById = catchAsync(async (req, res) => {
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  if (!organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization ID is required" });
  }

  const box = await boxService.getBoxById(req.params.boxId);
  res.status(httpStatus.OK).send(box);
});

exports.updateBox = catchAsync(async (req, res) => {
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  if (!organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization ID is required" });
  }

  const box = await boxService.updateBox(req.params.boxId, req.body);
  res.status(httpStatus.OK).send(box);
});

exports.deleteBox = catchAsync(async (req, res) => {
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  if (!organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization ID is required" });
  }

  await boxService.deleteBox(req.params.boxId);
  res.status(httpStatus.NO_CONTENT).send();
});
