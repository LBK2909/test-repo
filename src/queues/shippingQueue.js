const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// Define Redis connection options
const connectionOptions = {
  connection: {
    host: "localhost", // Redis server host
    port: 6379, // Redis server port
  },

  // Other queue options
};
const connection = new IORedis(); // Default connection to Redis.
const shippingQueue = new Queue("shipping", { connection: connectionOptions });

module.exports = shippingQueue;
