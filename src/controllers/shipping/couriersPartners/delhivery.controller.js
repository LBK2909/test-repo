const catchAsync = require("../../../utils/catchAsync.js");
const { delhivery } = require("../../../services/courierPartners/index.js");
const shippingQueue = require("../../../workers/queues/shippingQueue.js");
const { shippingService } = require("../../../services");
const { Job } = require("../../../models/index.js");
exports.createShipment = catchAsync(async (req, res) => {
  console.log("delhivery create shipment controller api");

  console.log("delhivery controller.....");
  //add a new job to the database
  //sample orders list of 2
  const ORDERS = [
    {
      orderId: "1234",
      name: "John Doe",
      address: "1234, 5th cross, 6th main, Bangalore",
      phone: "1234567890",
      partner: "delhivery",
    },
    {
      orderId: "1235",
      name: "Jane Doe",
      address: "1235, 5th cross, 6th main, Bangalore",
      phone: "1234567891",
      partner: "DHL",
    },
    {
      orderId: "1235",
      name: "Jane Doe",
      address: "1235, 5th cross, 6th main, Bangalore",
      phone: "1234567891",
      partner: "Fedex",
    },
  ];
  let totalOrders = ORDERS.length;

  if (totalOrders > 1) {
    const job = new Job({
      name: "generateLabel",
      status: "processing",
      summary: {
        totalOrders: totalOrders,
        completedOrders: 0,
        failedOrders: 0,
      },
    });
    let newJob = await job.save();
    res.send(jobData);

    for (const order of ORDERS) {
      //return the job id to the client
      let jobData = { jobId: newJob._id, order: order };
      console.log("jobData : ", jobData);
      await shippingQueue.add("generateLabel", jobData, {
        removeOnComplete: true, // Automatically remove job data on completion
        removeOnFail: false, // Automatically remove job data on failure
      });
    }
    console.log("resp=====", resp);
  } else {
    let resp = delhivery.createShipment(ORDERS);
    res.send(resp);
  }
});
