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
  try {
    let id = req.params.id;
    let payloadObj = req.body;
    let updated = await Order.findByIdAndUpdate(id, { $set: payloadObj }, { new: true })
      .then((data) => {
        return data;
      })
      .catch((err) => {
        console.log(err);
        throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating orders");
      });
    res.status(200).send(updated);
  } catch (err) {
    console.log("error in updateOrder controller...", err);
    res.status(503).send(err);
  }
});

exports.updateOrderLineItems = catchAsync(async (req, res) => {
  try {
    let id = req.params.id;
    let payloadObj = req.body;
    // Assume these are the changes you want to make:

    const { updateDocument, arrayFilters } = generateUpdateDocumentAndArrayFilters(payloadObj);
    // Execute the update
    let result = await Order.findByIdAndUpdate({ _id: id }, updateDocument, { arrayFilters, new: true });
    res.status(200).send(result);
  } catch (err) {
    console.log("error in updateOrder controller...", err);
    res.status(503).send(err);
  }
});
const generateUpdateDocumentAndArrayFilters = (updates) => {
  const updateDocument = { $set: {} };
  const arrayFilters = [];
  updates.forEach((update, index) => {
    const itemIdentifier = `item${index + 1}`;
    for (const key in update) {
      if (key !== "_id") {
        updateDocument.$set[`lineItems.$[${itemIdentifier}].${key}`] = update[key];
      }
    }
    arrayFilters.push({ [`${itemIdentifier}._id`]: update._id });
  });

  return { updateDocument, arrayFilters };
};
