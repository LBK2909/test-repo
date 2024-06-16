function getJobModel() {
  return require("../models/queues/job.model.js");
}
function getCounterModel() {
  return require("../models/counter.model.js");
}
function getOrderModel() {
  return require("../models/order.model.js");
}
function getCourierModel() {
  return require("../models/courier/courier.model.js");
}
const getNextDocumentId = async (sequenceName) => {
  const CounterModel = getCounterModel();
  const counterDocument = await CounterModel.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );
  return counterDocument.count || 1;
};
async function updateJobStatus(jobId, statusField) {
  try {
    const JobModel = getJobModel();
    const updateFields = {
      $inc: { [`summary.${statusField}`]: 1 }, // Dynamically set the field
    };
    const updatedJob = await JobModel.findOneAndUpdate({ _id: jobId }, updateFields, { new: true });
    return updatedJob;
  } catch (error) {
    console.error("Error updating job status:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
}

const updateOrderStatus = async (id, obj) => {
  try {
    const OrderModel = getOrderModel();
    const result = await OrderModel.findByIdAndUpdate({ _id: id }, { $set: obj }, { new: true });

    return result;
  } catch (error) {
    // Handle the error appropriately
    console.error("Error updating order status:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
async function getCourierEndpoint(courierName, environment) {
  try {
    const getCourierModel = getCounterModel();
    const courier = await getCourierModel.findOne({ name: courierName });
    if (!courier) {
      throw new Error("Courier not found");
    }

    const endpoint = courier.endpoints[environment];
    if (!endpoint) {
      throw new Error(`Endpoint for ${environment} not found`);
    }

    return endpoint;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  getNextDocumentId,
  updateJobStatus,
  updateOrderStatus,
};
