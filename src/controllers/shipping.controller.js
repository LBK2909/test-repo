// const SocketManager = require("../sockets/socketManager").getInstance();
const shippingQueue = require("../queues/shippingQueue");
const { shippingService } = require("../services");
const { Job } = require("../models");

exports.delhiveryCourier = async (req, res) => {
  console.log("delhivery controller.....");
  //add a new job to the database
  const job = new Job({
    name: "generateLabel",
    status: "processing",
    summary: {
      totalOrders: length,
      completedOrders: 0,
      failedOrders: 0,
    },
  });

  let newJob = await job.save();
  console.log("new job....", newJob);
  //return the job id to the client
  let jobData = { jobId: newJob._id };
  res.send(jobData);
  await shippingQueue.add("generateLabel", jobData, {
    removeOnComplete: true, // Automatically remove job data on completion
    removeOnFail: false, // Automatically remove job data on failure
  });
};
