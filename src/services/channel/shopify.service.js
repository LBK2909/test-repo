const bcrypt = require("bcryptjs");
let axios = require("axios");
const CustomError = require("../../utils/customError");
const { findOptimalBox } = require("../../utils/util.js");
const httpStatus = require("http-status");
let { ShopifyShop, Shop } = require("../../models/shop.model");
const { Order, OrderSyncJob, Box } = require("../../models");
const shopify = require("../../integrations/salesChannels/shopify");
const { orderSyncQueue } = require("../../workers/queues");
async function authenticateShop(shop) {
  const existingShop = await Shop.findOne({ name: shop });
  console.log({ existingShop });
  if (existingShop) {
    if (existingShop.organizationId) {
      return { url: `${process.env.CLIENT_BASE_URL}/organizations`, newShop: false };
    } else {
      return {
        url: `${process.env.CLIENT_BASE_URL}/channel-management?shop=${shop}&install=true&channel=shopify`,
        newShop: false,
      };
    }
  }
  let salt = null;
  try {
    // Generate a salt
    salt = await bcrypt.genSalt(10);
    nonce = salt;
    // You can use the salt with bcrypt.hash() to hash a password
  } catch (err) {
    console.error("Error generating salt:", err);
    throw err;
  }
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri = `${process.env.SERVER_BASE_URL}/auth/shopify/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=read_products,read_orders&state=${salt}&redirect_uri=${redirectUri}`;

  return { url: installUrl, newShop: true };
}

async function installShopifyApp(shop, code) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;

  try {
    const response = await axios.post(tokenUrl, {
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    });

    console.log(response.data);
    const ACCESS_TOKEN = response.data.access_token || null;
    // Get shop owner details from Shopify API
    const shopOwnerUrl = `https://${shop}/admin/api/2024-04/shop.json`;
    const shopResponse = await axios.get(shopOwnerUrl, {
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
      },
    });
    console.log(shopResponse.data);
    // Check if shop already exists
    const existingShop = await Shop.findOne({ name: shop });
    if (existingShop) {
      console.error("Shop already exists");
      // throw error here
      throw new CustomError(httpStatus.BAD_REQUEST, "Shop already exists");
    } else {
      const newShop = new ShopifyShop({
        name: shopResponse?.data?.shop?.name,
        email: shopResponse?.data?.shop?.email,
        storeUrl: shopResponse?.data?.shop?.domain,
        accessToken: ACCESS_TOKEN,
      });
      await newShop.save();
      console.log("Shop and Organization created successfully");
    }
    const redirectURI = `${process.env.CLIENT_BASE_URL}/channel-management?shop=${shop}&email=${shopResponse.data.shop.email}&install=true&channel=shopify`;
    return { url: redirectURI };
  } catch (error) {
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error getting access token");
  }
}

/**
 * Fetches and updates orders for a specified shop from Shopify.
 * This function queries the database for shop details, fetches orders from Shopify,
 * converts them to the required format, and updates the local database.
 *
 * @param {string} shop - The name of the shop whose orders are to be fetched.
 * @returns {Promise<string>} - A promise that resolves to a success message indicating
 *                              that orders were successfully updated, or rejects with an
 *                              error if any issues occur.
 * @throws {CustomError} - Throws an error if the shop is not found or if any part of the
 *                         order processing fails, with an appropriate HTTP status code.
 */

async function initiateSyncingProcess(shopId, orgId) {
  try {
    console.log("initiate syncing process...");
    const existingOrderSyncJob = await checkIfAnySyncIsAlreadyInProgress(shopId);
    console.log(existingOrderSyncJob);
    if (existingOrderSyncJob) {
      return existingOrderSyncJob._id;
    }
    const job = new OrderSyncJob({
      shopId: shopId,
      status: "processing",
      orgId: orgId,
    });
    await job.save();

    await orderSyncQueue.add("shopify", job, {
      removeOnComplete: true, // Automatically remove job data on completion
      removeOnFail: false, // Automatically remove job data on failure
    });
    return job._id;
  } catch (err) {
    let jobId = params._id;
    console.log("error in initiate synching process..");
    await OrderSyncJob.updateOne({ _id: jobId }, { status: "failed" });
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error initiating syncing process");
  }
}

async function checkIfAnySyncIsAlreadyInProgress(shopId) {
  console.log("check order sync in progress method..".bold.green);
  const orderSyncJob = await OrderSyncJob.findOne({ shopId: shopId, status: "processing" })
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log(err);
      throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error checking if any sync is already in progress");
    });
  return orderSyncJob;
}

async function fetchOrders(params) {
  try {
    let shopId = params.shopId;
    let jobId = params._id;
    let orgId = params.orgId;
    // Retrieve shop details from the database
    const shopDetails = await ShopifyShop.findById(shopId);
    if (!shopDetails) {
      console.log("shop not found...");
      throw new CustomError(httpStatus.NOT_FOUND, "Shop not found");
    }

    //get the latest orderId from the orders collection
    const latestOrder = await Order.findOne({ shopId: shopDetails._id }).sort({ orderId: -1 });
    const latestOrderId = latestOrder ? latestOrder.orderId : null;
    // Set up Shopify API client with the shop's details
    const shopifyClient = new shopify(shopDetails.accessToken, shopDetails.storeUrl);
    let boxes = await Box.find({ orgId: orgId });

    // Fetch orders from Shopify and process them
    let response = await fetchOrdersAPI({ latestOrderId });
    // Update the job status to "completed"
    await OrderSyncJob.updateOne({ _id: jobId }, { status: "completed" });
    return response;

    /**
     * Recursively fetches orders from Shopify and updates the local database.
     * Handles pagination by recursively calling itself if more pages are available.
     *
     * @param {object} params - Parameters for fetching orders including the latest order ID and pagination link.
     * @returns {Promise<string>} - A promise that resolves after all pages have been fetched and processed.
     * @throws {CustomError} - Throws an error if fetching or processing fails.
     */

    async function fetchOrdersAPI(params) {
      try {
        let { latestOrderId, link } = params;
        let payloadObj = {
          latestOrderId,
          link,
        };

        // Fetch orders using the Shopify client
        const response = await shopifyClient.fetchOrders(payloadObj);
        const orders = response.orders || [];

        // Convert and insert orders into the database
        const convertedOrders = orders.map((order) => {
          return {
            shop: shopDetails._id,
            orgId: shopDetails.organizationId,
            name: order.name,
            customer: order.customer,
            orderId: order.id,
            orderNumber: order.order_number,
            totalPrice: order.total_price,
            totalWeightGrams: getTotalWeight(order.line_items) || 0,
            lineItems: getLineItems(order.line_items),
            shippingAddress: order.shipping_address,
            billingAddress: order.billing_address,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            courierDetails: {
              packageDimensions: findOptimalBox(getTotalWeight(order.line_items), boxes),
              packageWeight: getTotalWeight(order.line_items),
              paymentMode: "prepaid",
            },
            // paymentGateway: order.payment_gateway_names,
            financialStatus: order.financial_status,
            notes: order.note,
          };
        });
        await Order.insertMany(convertedOrders);
        // Handle pagination
        let headerLink = parseLinkHeader(response.headerLink);
        if (headerLink.next) {
          await fetchOrdersAPI({ link: headerLink });
        }
        return "Orders updated successfully";
      } catch (error) {
        console.log("error in fetch orders api...");
        // console.log("error code in http status httpStatus.INTERNAL_SERVER_ERROR===", httpStatus.INTERNAL_SERVER_ERROR);
        throw new CustomError(error.statusCode || 500, error.message || "Error updating orders");
      }
    }
  } catch (err) {
    let jobId = params._id;
    await OrderSyncJob.updateOne({ _id: jobId }, { status: "failed" });
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, err);
  }
}

function parseLinkHeader(link) {
  if (!link) {
    return {};
  }
  const links = link.split(",");
  const parsedLinks = {};
  links.forEach((link) => {
    const [url, rel] = link.split(";");
    const urlMatch = url.match(/page_info=(.*)>/);
    const relMatch = rel.match(/rel="(.*)"/);
    if (urlMatch && relMatch) {
      parsedLinks[relMatch[1]] = urlMatch[1];
    }
  });
  return parsedLinks;
}
function getTotalWeight(lineItems) {
  const totalWeight = lineItems.reduce((sum, item) => sum + item.grams, 0);
  return totalWeight || 0;
}
function getLineItems(lineItems) {
  return lineItems.map((item) => {
    return {
      name: item.name,
      quantity: item.quantity,
      grams: item.grams,
      price: item.price,
      productId: item.product_id,
      variantId: item.variant_id,
    };
  });
}
//   this.link = parsedLinks;
//   this.updatePaginateButton = ~this.updatePaginateButton;
module.exports = {
  authenticateShop,
  installShopifyApp,
  fetchOrders,
  parseLinkHeader,
  initiateSyncingProcess,
};
