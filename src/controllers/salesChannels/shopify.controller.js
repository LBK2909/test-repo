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
