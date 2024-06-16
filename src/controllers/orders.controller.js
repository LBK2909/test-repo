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

exports.updateOrder = catchAsync(async (req, res) => {
  let orgId = req.cookies.orgId;
  orgId = parseInt(orgId);
  // let orderId = req.params.orderId;
  let body = req.body;
  let orderId = body.id;
  let courierPartner = body.courierPartner;
  let updated = await Order.findOneAndUpdate({ _id: orderId }, { $set: { courierPartner: courierPartner } })
    .then((order) => {
      return order;
    })
    .catch((err) => {
      console.log(err);
    });
  console.log({ updated });
});
