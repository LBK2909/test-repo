const { updateJobStatus, updateOrderStatus } = require("../../utils/db");
const courierPartners = {
  delhivery: require("../../services/courierPartners/index.js"),
};
const shippingJobHandler = async (job) => {
  try {
    console.log("Processing shipping job:", job.id);
    // console.log(job.data);
    let orders = job?.data?.orders;
    let jobId = job?.data?.jobId;
    // console.log(orders);
    for (const order of orders) {
      // let partner = order.partner || null;
      // let partner = order?.courierPartner?.name || null;
      let partner = order.shippingService?._id?.courierId?.name || null;
      if (!partner) {
        updateOrderStatus(order._id, {
          status: "pending",
          "courierDetails.bookingInfo": "Courier partner not found",
          "courierDetails.bookingStatus": "failed",
        });
      }
      //convert the first letter to lowercase
      const partnerModule = courierPartners?.[partner]?.[partner];
      if (partnerModule && typeof partnerModule.createShipment === "function") {
        try {
          await updateOrderStatus(order._id, { status: "processing" });
          partnerModule.createShipment(order, jobId);
        } catch (err) {
          await updateOrderStatus(order._id, { status: "pending" });
        }
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
