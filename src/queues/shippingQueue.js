const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// Define Redis connection options
const connectionOptions = {
  host: "localhost", // or your Redis server host
  port: 6379, // or your Redis server port
  // Set maxRetriesPerRequest to null as required by BullMQ
  maxRetriesPerRequest: null,
};
const connection = new IORedis(); // Default connection to Redis.
const shippingQueue = new Queue("shipping", { connection: connectionOptions });

module.exports = shippingQueue;
