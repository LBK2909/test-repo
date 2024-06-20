const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { User, Order } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");

const CustomError = require("../utils/customError");

exports.orders = catchAsync(async (req, res) => {
  let orgId = parseInt(req.cookies.orgId);
  let { page = 1, itemsPerPage = 10, status } = req.query;
  page = parseInt(page);
  itemsPerPage = parseInt(itemsPerPage);
  // Calculate the number of documents to skip
  const skip = (page - 1) * itemsPerPage;
  const query = { orgId: orgId }; // Add status key field to the query

  if (status) query.status = status;
  const orders = await Order.find(query)
    .sort({ _id: 1 }) // Ensure sorting by _id
    .skip(skip)
    .limit(itemsPerPage)
    .populate("shop", "name channel")
    .catch((err) => {
      console.log(err);
      return [];
    });
  const totalOrders = await Order.countDocuments(query);

  res.status(httpStatus.OK).send({ orders, totalOrders });
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
