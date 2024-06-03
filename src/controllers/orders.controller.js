const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { User, Order } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");

const CustomError = require("../utils/customError");
exports.orders = catchAsync(async (req, res) => {
  let orgId = req.cookies.orgId;
  orgId = parseInt(orgId);
  const orders = await Order.find({ orgId: orgId })
    .populate("shop", "name")
    .then((orders) => {
      return orders || [];
    })
    .catch((err) => {
      console.log(err);
    });

  res.status(httpStatus.OK).send(orders);
});
