const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const connectDB = require("../config/db");

// const { generateLabel, sendShippingEmail, delhiveryCourier } = require("../services/booking.service.js");
connectDB();
const { shippingService } = require("../services");

console.log("worker js file executed!!!");
const connection = new IORedis();
// Define Redis connection options
const connectionOptions = {
  host: "localhost", // or your Redis server host
  port: 6379, // or your Redis server port
  // Set maxRetriesPerRequest to null as required by BullMQ
  maxRetriesPerRequest: null,
};
const worker = new Worker(
  "shipping",
  async (job) => {
    if (job.name === "generateLabel") {
      await shippingService.delhiveryCourier(job.data);
    } else if (job.name === "sendEmail") {
      await sendShippingEmail(job.data);
    }
  },
  { connection: connectionOptions }
);

// worker.on("completed", (job) => {
//   console.log(`Job ${job.id} has completed!`);
// });

// worker.on("failed", (job, err) => {
//   console.error(`Job ${job.id} has failed with error ${err.message}`);
// });
