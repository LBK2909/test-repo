// const SocketManager = require("../sockets/socketManager").getInstance();
const shippingQueue = require("../workers/queues/shippingQueue");
const { shippingService } = require("../services");
const { Job, Order, Courier, Organization, OrganizationCourier } = require("../models");
const CustomError = require("../utils/customError");
const httpStatus = require("http-status");
const { updateOrderStatus } = require("../utils/db.js");

const courierPartners = {
  delhivery: require("../services/courierPartners"),
};
const catchAsync = require("../utils/catchAsync");

exports.shipmentBooking = catchAsync(async (req, res) => {
  try {
    let orders = req.body.orders;
    let ordersList = [];
    const orgId = req.cookies["orgId"];
    let orderIds = orders.map((order) => order.orderId);
    ordersList = await Order.find({ _id: { $in: orders }, status: { $eq: "pending" } }).populate({
      path: "shippingService._id",
      model: "OrganizationCourier",
      populate: {
        path: "courierId",
        model: "Courier",
      },
    });

    let organization = await Organization.findOne({ _id: orgId });
    ordersList = ordersList.map((order) => {
      const plainOrder = order.toObject(); // Convert Mongoose document to plain JavaScript object
      return {
        ...plainOrder,
        orgId,
        organization,
      };
    });

    // // update all the orders to processing
    // if (ordersList.length > 0) {
    //   let orderIdsToUpdate = ordersList.map((order) => order._id);
    //   await Order.updateMany({ _id: { $in: orderIdsToUpdate } }, { status: "processing" });
    // }

    let totalOrders = ordersList.length;
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

      //return the job id to the client
      let jobData = { jobId: newJob._id, orders: ordersList };
      await shippingQueue.add("generateLabel", jobData, {
        removeOnComplete: true, // Automatically remove job data on completion
        removeOnFail: false, // Automatically remove job data on failure
      });
    } else if (totalOrders === 1) {
      // let resp = await shippingService.delhiveryCourier(ORDERS);
      let order = ordersList[0] || {};
      let partner = ordersList[0].shippingService?._id?.courierId?.name || null;
      if (!partner) {
        updateOrderStatus(order._id, {
          status: "pending",
          "courierDetails.bookingInfo": "Courier partner not found",
          "courierDetails.bookingStatus": "failed",
        });
        throw new CustomError(httpStatus.BAD_REQUEST, "Courier partner not found");
      }
      //convert the first letter to lowercase
      // partner = partner.charAt(0).toLowerCase() + partner.slice(1);
      const partnerModule = courierPartners?.[partner]?.[partner];
      if (partnerModule && typeof partnerModule.createShipment === "function") {
        try {
          await updateOrderStatus(order._id, { status: "processing" });
          let result = await partnerModule.createShipment(order);
          res.status(200).send(result);
        } catch (err) {
          await updateOrderStatus(order._id, { status: "pending" });
          console.log("error in shipmentBooking controller...", err);
          throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, err);
        }
      } else {
        console.error(`Invalid courier partner or createShipment method not found: ${partner}`);
        res.status(400).send("Invalid courier partner or createShipment method not found");
      }
    } else {
      console.log("no orders to process..");
      res.status(204).send("No Content");
    }
  } catch (err) {
    console.log("error in shipmentBooking controller...", err);
    res.status(503).send(err);
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
    if (!job) {
      throw new CustomError(httpStatus.NOT_FOUND, "Job not found");
    }
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
    res.status(503).send(err);
  }
});

exports.getCouriersByOrganization = catchAsync(async (req, res) => {
  console.log("get couriers by organization..");
  let organizationId = parseInt(req.cookies["orgId"]) || null;

  const courierList = await OrganizationCourier.find({ organizationId: organizationId, isActive: true })
    .select("selectedShippingModes name")
    .populate({
      path: "courierId",
      select: "shippingModes",
    });

  res.status(httpStatus.OK).send(courierList);
});

exports.bulkUpdateOrders = catchAsync(async (req, res) => {
  try {
    let { key, value, orderIds } = req.body;
    let updated = await Order.updateMany({ _id: { $in: orderIds } }, { $set: { [key]: value } })
      .then((data) => {
        return data;
      })
      .catch((err) => {
        console.log(err);
        throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating orders");
      });
    res.status(200).send(updated);
  } catch (err) {
    console.log("error in bulkUpdateOrders controller...", err);
    res.status(503).send(err);
  }
});
