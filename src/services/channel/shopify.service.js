const bcrypt = require("bcryptjs");
let axios = require("axios");
const CustomError = require("../../utils/customError");
const { findOptimalBox } = require("../../utils/util.js");
const httpStatus = require("http-status");
let { ShopifyShop, Shop } = require("../../models/shop.model");
const { Order, OrderSyncJob, Box } = require("../../models");
const Shopify = require("../../integrations/salesChannels/shopify");
const { orderSyncQueue } = require("../../workers/queues");
const https = require("https");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { emailService } = require("../index.js");

async function authenticateShop(shop) {
  const existingShop = await Shop.findOne({ storeUrl: shop });
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
  const scope =
    "read_products,read_orders,read_fulfillments,write_fulfillments,read_assigned_fulfillment_orders,write_assigned_fulfillment_orders,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders";
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${salt}&redirect_uri=${redirectUri}`;

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
        shopId: shopResponse?.data?.shop?.id,
        name: shopResponse?.data?.shop?.name,
        shopOwnerEmail: shopResponse?.data?.shop?.email,
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
    const latestOrder = await Order.findOne({ shop: shopDetails._id }).sort({ orderId: -1 });
    const latestOrderId = latestOrder ? latestOrder.orderId : null;
    // Set up Shopify API client with the shop's details
    const shopifyClient = new Shopify(shopDetails.accessToken, shopDetails.storeUrl);
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
          let paymentStatus = checkPaymentStatus(order);
          return {
            shop: shopDetails._id,
            orgId: shopDetails.organizationId,
            storeId: shopDetails.shopId,
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
              paymentMode: paymentStatus,
            },
            financialStatus: order.financial_status,
            notes: order.note,
            paymentGateway: order.payment_gateway_names,
            paymentStatus: order.financial_status,
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

async function fulfillOrdersInShopify(ordersList) {
  try {
    let shopify = new Shopify();
    let orders = await Order.find({ _id: { $in: ordersList }, status: { $eq: "booked" } })
      .populate("shop")
      .select("courierDetails orderId");
    // console.log("orders", orders);
    const fulfillmentDetails = await shopify.fetchFulfillmentIdFromShopify(orders);
    const fulfilledOrders = await shopify.orderFulfillmentShopifyAPI(fulfillmentDetails);
    return fulfilledOrders;
  } catch (error) {
    console.error("Error while fulfilling orders in Shopify:", error);
    throw error;
  }
}
function checkPaymentStatus(order) {
  let status = "";
  if (
    order.payment_gateway_names?.some((pg) => pg.toLowerCase().includes("cash on delivery")) &&
    order.financial_status === "pending"
  ) {
    status = "COD";
  } else {
    status = "Prepaid";
  }
  return status;
  // } else if (["paid", "partially_paid"].includes(order.financial_status)) {
  //   status = "Prepaid";
  // } else if (["authorized", "partially_refunded", "refunded", "voided"].includes(order.financial_status)) {
  //   status = "Prepaid";
  // }
}

async function webhookCustomerRedact(payload) {
  let { shop_id, customer } = payload;
  if (!shop_id || !customer) {
    throw new CustomError(httpStatus.BAD_REQUEST, "Invalid request payload");
  }

  let orders;

  if (customer.id) {
    orders = await Order.find({ "customer.id": customer.id, storeId: shop_id }, { customer: 1, status: 1, shippingAddress: 1 });
  } else if (customerEmail) {
    orders = await Order.find(
      { "customer.email": customer.email, storeId: shop_id },
      { customer: 1, status: 1, shippingAddress: 1 }
    );
  } else {
    orders = [];
  }
  for (const order of orders) {
    order.customer = null;
    if (order.shippingAddress) {
      order.shippingAddress.first_name = "s";
      order.shippingAddress.last_name = "";
      order.shippingAddress.address1 = "";
      order.shippingAddress.phone = "";
      order.shippingAddress.city = "s";
      order.shippingAddress.zip = "";
      order.shippingAddress.province = "";
      order.shippingAddress.country = "";
      order.shippingAddress.address2 = "";
      order.shippingAddress.company = "s";
      order.shippingAddress.latitude = "";
      order.shippingAddress.longitude = "";
      order.shippingAddress.name = "";
      order.shippingAddress.country_code = "";
      order.shippingAddress.province_code = "";
    }
    order.markModified("customer");
    order.markModified("shippingAddress");
    await order.save();
  }

  return "Customer data redacted";
}
async function webhooksGetCustomerDataRequest(payload) {
  console.log("webhooksGetCustomerDataRequest");
  try {
    let { shop_id, customer } = payload;
    if (!shop_id || !customer) {
      throw new CustomError(httpStatus.BAD_REQUEST, "Invalid request payload");
    }
    // Retrieve the requested orders from the database
    let orders;
    if (customer.id) {
      orders = await Order.find(
        { "customer.id": customer.id, storeId: shop_id },
        {
          customer: 1,
          status: 1,
          name: 1,
          shippingAddress: 1,
        }
      );
    } else if (customer.email) {
      orders = await Order.find(
        { "customer.email": customer.email, storeId: shop_id },
        {
          customer: 1,
          status: 1,
          name: 1,
          shippingAddress: 1,
        }
      );
    } else {
      orders = [];
    }

    let shop = await ShopifyShop.findOne({ shopId: shop_id });
    if (!shop) throw new CustomError(httpStatus.NOT_FOUND, "Shop not found");

    let shopOwnerEmail = shop?.shopOwnerEmail || "";
    let shopName = shop?.name || "";
    let customerEmail = customer.email || customer.id;
    // Upload customer data to S3 and generate a pre-signed URL
    const presignedUrl = await uploadCustomerDataToS3(customer.id || customer.email, orders);
    // Send the pre-signed URL to the store owner
    await emailService.sendCustomerDataEmail(shopOwnerEmail, shopName, customerEmail, presignedUrl);
    return "Customer data request returned";
  } catch (error) {
    console.error("Error handling customers/data_request webhook:", error);
    throw new CustomError(error || httpStatus.INTERNAL_SERVER_ERROR, "Error handling customers/data_request webhook");
  }
}
async function webhooksShopRedact(payload) {
  try {
    const { shop_id } = payload;
    const removeShop = await Shop.deleteOne({ shopId: shop_id });
    const removeOrders = await Order.deleteMany({ storeId: shop_id });
    return "shop data redacted...";
  } catch (err) {
    console.error("Error while deleting shop:", err);
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error while deleting shop");
  }
}
// Initialize S3 Client
const initializeS3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_PROG_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_PROG_SECRET_ACCESS_KEY,
    },
  });
};

// Function to create a pre-signed URL for PutObject
const createPresignedPutUrl = async ({ client, bucket, key }) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: "application/json",
  });
  return await getSignedUrl(client, command, { expiresIn: 10000 });
};

// Function to create a pre-signed URL for GetObject
const createPresignedGetUrl = async ({ client, bucket, key }) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return await getSignedUrl(client, command, { expiresIn: 10000 });
};

// Function to upload data using a pre-signed URL
const put = (url, data) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "PUT",
        headers: {
          "Content-Length": Buffer.byteLength(data),
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve(responseBody);
        });
      }
    );
    req.on("error", (err) => {
      reject(err);
    });
    req.write(data);
    req.end();
  });
};

// Main function to upload data and generate pre-signed URL for viewing
const uploadCustomerDataToS3 = async (customer, data) => {
  const client = initializeS3Client();
  const REGION = process.env.AWS_REGION;
  const BUCKET_NAME = process.env.S3_CUSTOMER_DATA_BUCKET_NAME;
  const timeStamp = new Date().getTime();
  const KEY = `customer-data/${customer}-${timeStamp}.json`;

  try {
    // Generate pre-signed URL for PutObject
    const putUrl = await createPresignedPutUrl({
      client,
      bucket: BUCKET_NAME,
      key: KEY,
    });

    // Upload JSON data using the pre-signed URL
    await put(putUrl, JSON.stringify(data));

    // Generate pre-signed URL for GetObject
    const getUrl = await createPresignedGetUrl({
      client,
      bucket: BUCKET_NAME,
      key: KEY,
    });

    return getUrl;
  } catch (err) {
    console.error("Error:", err);
    if (err instanceof Error) {
      console.error("Stack trace:", err.stack);
    }
  }
};

module.exports = {
  authenticateShop,
  installShopifyApp,
  fetchOrders,
  parseLinkHeader,
  initiateSyncingProcess,
  fulfillOrdersInShopify,
  webhooksGetCustomerDataRequest,
  webhookCustomerRedact,
  webhooksShopRedact,
};
