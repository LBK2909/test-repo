const { Worker } = require("bullmq");
const { shippingService } = require("../services/index.js");
const { shippingQueue, orderSyncQueue } = require("./queues/index.js");
const redisConfig = require("../config/redis");

const { delhivery } = require("../services/courierPartners/index.js");
const courierPartners = {
  delhivery: require("../services/courierPartners/index.js"),
};
require("../config/logger.js");

const { updateJobStatus } = require("../utils/db.js");
const connectDB = require("../config/db.js");
const { shippingJobHandler, orderSyncJobHandler } = require("./jobHandlers");
connectDB();
// This script defines a function to start a BullMQ worker for processing jobs from the "shipping" queue.
// It initializes a worker instance, defines a job handler function, and configures the worker to connect to a Redis server.
// The worker processes incoming jobs using a service function and handles any errors that occur during processing.
// Additionally, it ensures that the queue is drained and cleaned before starting the worker to maintain a clean state.
// Finally, the function is exported to make it accessible to other modules.

// const startWorker = async () => {
//   const worker = new Worker(
//     "shipping",
//     async (job) => {
//       try {
//         if (job.name === "generateLabel") {
//           console.log("Processing generateLabel job:", job.id);
//           console.log(job.data);
//           let orders = job?.data?.orders;
//           let jobId = job?.data?.jobId;
//           for (const order of orders) {
//             console.log("Processing order:", order);
//             let partner = order.partner || null;
//             const partnerModule = courierPartners?.[partner]?.[partner];
//             console.log("partnerModule", partnerModule);
//             if (partnerModule && typeof partnerModule.createShipment === "function") {
//               await partnerModule.createShipment(order, jobId);
//             } else {
//               updateJobStatus(jobId, "failedOrders");
//               console.error(`Invalid courier partner or createShipment method not found: ${partner}`);
//             }
//           }
//         }
//       } catch (err) {
//         // Log the error
//         console.error("Error processing job:", err);
//         // Mark the job as failed
//         await job.moveToFailed(err, true);
//       }
//     },
//     {
//       connection: {
//         host: "localhost", // Redis server host
//         port: 6379, // Redis server port
//       },
//       maxRetriesPerRequest: null,
//     }
//   );
//   // Get the shipping queue instance
//   const queue = await shippingQueue;

//   // Drain the queue, processing all pending jobs
//   await queue.drain(true);

//   // Clean the queue, removing all completed and failed jobs
//   await queue.clean(0);
//   return worker;
// };

const startWorkers = async () => {
  // Initialize workers for different queues
  const workers = [];

  // Shipping queue worker
  const shippingWorker = new Worker("shipping", shippingJobHandler, redisConfig);
  workers.push({ worker: shippingWorker });
  const orderSyncWorker = new Worker("orderSync", orderSyncJobHandler, redisConfig);
  workers.push({ worker: orderSyncWorker });
  // Additional queues can be added similarly
  // const anotherQueueWorker = new Worker("anotherQueue", jobHandler, redisConfig);
  // const anotherQueueScheduler = new QueueScheduler("anotherQueue", redisConfig);
  // workers.push({ worker: anotherQueueWorker, scheduler: anotherQueueScheduler });

  // Drain and clean queues before starting
  await shippingQueue.drain(true);
  await shippingQueue.clean(0);
  await orderSyncQueue.drain(true);
  await orderSyncQueue.clean(0);
  return workers;
};
module.exports = { startWorkers };
