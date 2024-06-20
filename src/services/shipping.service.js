const httpStatus = require("http-status");
const { Order } = require("../models");
const { Shop, ShopifyShop } = require("../models/shop.model");
const CustomError = require("../utils/customError");

async function updateOrdersWithFulfillment(responses) {
  //   console.log(responses);
  for (const response of responses) {
    let fulfillmentStatus = response.value?.fulfillment?.status || null;
    let orderId = response.value?.order?._id || null;
    if (response.status === "fulfilled" && fulfillmentStatus != "failed") {
      await handleFulfilledResponse(orderId, response.value.fulfillment);
    } else {
      await handleRejectedResponse(orderId, response);
    }
  }
}

async function handleFulfilledResponse(orderId, fulfillment) {
  if (!orderId || !fulfillment) {
    console.error("Invalid order ID or fulfillment data in fulfilled response.");
    return;
  }

  try {
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          status: "shipped",
          fulfillment: {
            id: fulfillment.id,
            status: fulfillment.status,
            createdAt: fulfillment.created_at,
            trackingCompany: fulfillment.tracking_company,
            trackingNumber: fulfillment.tracking_number,
            trackingURL: fulfillment.tracking_url,
          },
        },
      }
    );

    console.log(`Order ${orderId} updated with fulfillment ${fulfillment.id}`);
  } catch (error) {
    console.error(`Error updating order ${orderId} with fulfillment ${fulfillment.id}:`, error);
  }
}

async function handleRejectedResponse(orderId, reason) {
  if (!orderId) {
    console.error("Invalid order ID in rejected response.");
    return;
  }

  try {
    await Order.updateOne(
      { _id: orderId },
      {
        $set: {
          status: "booked",
          fulfillment: {
            status: "failed",
          },
        },
      }
    );

    console.error(`Fulfillment for order ${orderId} failed:`, reason);
  } catch (error) {
    console.error(`Error updating order ${orderId} with failure reason:`, error);
  }
}

module.exports = { updateOrdersWithFulfillment };
