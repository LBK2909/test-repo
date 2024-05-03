const { Worker } = require("bullmq");
const { shippingService } = require("../services");
const shippingQueue = require("../queues/shippingQueue");
const connectDB = require("../config/db");
connectDB();

// This script defines a function to start a BullMQ worker for processing jobs from the "shipping" queue.
// It initializes a worker instance, defines a job handler function, and configures the worker to connect to a Redis server.
// The worker processes incoming jobs using a service function and handles any errors that occur during processing.
// Additionally, it ensures that the queue is drained and cleaned before starting the worker to maintain a clean state.
// Finally, the function is exported to make it accessible to other modules.

const startWorker = async () => {
  const worker = new Worker(
    "shipping",
    async (job) => {
      try {
        if (job.name === "generateLabel") {
          await shippingService.delhiveryCourier(job.data);
        }
      } catch (err) {
        // Log the error
        console.error("Error processing job:", err);
        // Mark the job as failed
        await job.moveToFailed(err, true);
      }
    },
    {
      connection: {
        host: "localhost", // Redis server host
        port: 6379, // Redis server port
      },
      maxRetriesPerRequest: null,
    }
  );
  // Get the shipping queue instance
  const queue = await shippingQueue;

  // Drain the queue, processing all pending jobs
  await queue.drain(true);

  // Clean the queue, removing all completed and failed jobs
  await queue.clean(0);
  return worker;
};

module.exports = { startWorker };
