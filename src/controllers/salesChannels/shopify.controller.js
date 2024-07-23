const catchAsync = require("../../utils/catchAsync.js");
const ShopifyService = require("../../services/channel/shopify.service.js");
const { OrderSyncJob } = require("../../models");

exports.syncOrders = catchAsync(async (req, res) => {
  try {
    let shopId = req.params.shopId;
    let orgId = req.cookies.orgId;
    const data = await ShopifyService.initiateSyncingProcess(shopId, orgId);
    // const data = await ShopifyService.initiateSyncingProcess(shopId);
    console.log(data);
    res.json(data);
  } catch (error) {
    console.log(error);
    // Handle any errors
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.getOrderSyncStatus = catchAsync(async (req, res) => {
  try {
    const jobId = req.params?.jobId ?? null;
    let job = await OrderSyncJob.findOne({ _id: jobId })
      .then((data) => {
        return data;
      })
      .catch((err) => {
        console.log(err);
        throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error checking if any sync is already in progress");
      });
    if (!job) {
      throw new CustomError(httpStatus.NOT_FOUND, "Job not found");
    }
    if (job && job.status === "completed") {
      res.status(200).send(job);
    } else {
      res.status(202).send("Job status is still processing");
    }
  } catch (err) {
    console.log("error in bulkShipmentStatus controller...", err);
    res.status(503).send(err);
  }
});

exports.webhooksCustomerRedact = catchAsync(async (req, res) => {
  try {
    let payload = req.body;
    console.log(payload);
    // let payload = {
    //   shop_id: 87448322347,
    //   shop_domain: "{shop}.myshopify.com",
    //   orders_requested: [299938, 280263, 220458],
    //   customer: { id: 7874214986027, email: "harish@fouvi.co", phone: "555-625-1199" },
    //   data_request: { id: 9999 },
    // };
    let response = await ShopifyService.webhookCustomerRedact(payload);
    res.status(200).json({ error: "webhooksCustomerRedact" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

exports.webhooksCustomerDataRequest = catchAsync(async (req, res) => {
  try {
    let payload = req.body;

    // let payload = {
    //   shop_id: 87448322347,
    //   shop_domain: "cobay-demo-store.myshopify.com",
    //   customer: { id: 7874214986027, email: "harish@fouvi.co", phone: null },
    //   orders_requested: [
    //     5901025607979, 5901026197803, 5914711589163, 5914738884907, 5914740490539, 5917173481771, 5955061645611, 5979288633643,
    //     5980388098347, 5980715680043, 5980716826923,
    //   ],
    // };
    let response = await ShopifyService.webhooksGetCustomerDataRequest(payload);
    res.status(200).json("customer data request returned");
  } catch (error) {
    res.status(500).json(error);
  }
});

exports.webhooksShopRedact = catchAsync(async (req, res) => {
  console.log("webhoooks shop redact mehtod....");
  try {
    let payload = req.body;
    // let payload = {
    //   shop_id: 65300758711,
    //   shop_domain: "{shop}.myshopify.com",
    //   orders_requested: [299938, 280263, 220458],
    //   customer: { id: 191167, email: "john@example.com", phone: "555-625-1199" },
    //   data_request: { id: 9999 },
    // };
    let response = await ShopifyService.webhooksShopRedact(payload);
    res.status(200).json("customer data request returned");
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});
