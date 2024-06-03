// const SocketManager = require("../sockets/socketManager").getInstance();
const shippingQueue = require("../workers/queues/shippingQueue");
const { shippingService } = require("../services");
const { Job, Order, Courier } = require("../models");
const CustomError = require("../utils/customError");
const httpStatus = require("http-status");

const courierPartners = {
  delhivery: require("../services/courierPartners"),
};
const catchAsync = require("../utils/catchAsync");

exports.shipmentBooking = catchAsync(async (req, res) => {
  console.log(req.body);
  console.log("delhivery controller.....");
  let orders = req.body.orders;
  let orderIds = orders.map((order) => order.orderId);
  let updatedOrders = [];
  let ordersToUpdate = await Order.find({ _id: { $in: orders }, status: { $ne: "processing" } });
  if (ordersToUpdate.length > 0) {
    const orderIdsToUpdate = ordersToUpdate.map((order) => order._id);
    await Order.updateMany({ _id: { $in: orderIdsToUpdate } }, { status: "processing" });
    let processingOrders = ordersToUpdate.map((order) => order.orderId);
  }

  const ORDERS = [
    {
      orderId: "1234",
      name: "John Doe",
      address: "1234, 5th cross, 6th main, Bangalore",
      phone: "1234567890",
      partner: "delhivery",
    },
    // {
    //   orderId: "1234",
    //   name: "John Doe",
    //   address: "1234, 5th cross, 6th main, Bangalore",
    //   phone: "1234567890",
    //   partner: "delhivery",
    // },
  ];
  let totalOrders = ORDERS.length;
  // let totalOrders = updatedOrders.length;
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
    let pollingIntervalPeriod = totalOrders * 1000;
    res.send({ jobId: newJob._id, pollingIntervalPeriod });
    let orders = ORDERS.map((order) => order.orderId);
    await Order.updateMany({ orderId: orders }, { status: "processing" });
    //return the job id to the client
    let jobData = { jobId: newJob._id, orders: ORDERS };
    console.log("jobData : ", jobData);
    await shippingQueue.add("generateLabel", jobData, {
      removeOnComplete: true, // Automatically remove job data on completion
      removeOnFail: false, // Automatically remove job data on failure
    });
  } else if (totalOrders === 1) {
    // let resp = await shippingService.delhiveryCourier(ORDERS);
    let order = ORDERS[0] || {};
    let partner = order.partner || null;
    const partnerModule = courierPartners?.[partner]?.[partner];
    console.log("partnerModule", partnerModule);
    if (partnerModule && typeof partnerModule.createShipment === "function") {
      let result = await partnerModule.createShipment(order);
      res.status(200).send(result);
    } else {
      console.error(`Invalid courier partner or createShipment method not found: ${partner}`);
      res.status(400).send("Invalid courier partner or createShipment method not found");
    }
  } else {
    res.status(200).send("No orders to process");
  }
});

exports.bulkShipmentStatus = catchAsync(async (req, res) => {
  try {
    const jobId = req.params?.jobId ?? null;
    let job = await Job.findOne({ _id: jobId })
      .then((data) => {
        return data;
      })
      .catch((err) => {
        console.log(err);
        throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error checking if any sync is already in progress");
      });
    if (job && job.status === "completed") {
      let orders = job.orders || [];
      const orderDetails = await Order.find({ orderId: { $in: orders } });
      res.status(200).send(orderDetails);
    } else {
      res.status(202).send("Job status is still processing");
    }
    console.log("job", job);
  } catch (err) {
    console.log("error in bulkShipmentStatus controller...", err);
    res.status(503).send("error in bulkShipmentStatus controller...");
  }
});
