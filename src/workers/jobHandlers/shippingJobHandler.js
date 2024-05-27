const { updateJobStatus } = require("../../utils/db");
const courierPartners = {
  delhivery: require("../../services/courierPartners/index.js"),
};
const shippingJobHandler = async (job) => {
  try {
    console.log("Processing shipping job:", job.id);
    console.log("job name:", job);
    console.log(job.data);
    let orders = job?.data?.orders;
    let jobId = job?.data?.jobId;
    for (const order of orders) {
      let partner = order.partner || null;
      const partnerModule = courierPartners?.[partner]?.[partner];
      console.log("partnerModule", partnerModule);
      if (partnerModule && typeof partnerModule.createShipment === "function") {
        await partnerModule.createShipment(order, jobId);
      } else {
        updateJobStatus(jobId, "failedOrders");
        console.error(`Invalid courier partner or createShipment method not found: ${partner}`);
      }
    }
  } catch (err) {
    console.error("Error processing shipping job:", err);
    await job.moveToFailed(err, true);
  }
};

module.exports = shippingJobHandler;
