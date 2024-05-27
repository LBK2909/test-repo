const { Queue } = require("bullmq");
const redisConfig = require("../../config/redis");
const shippingQueue = new Queue("shipping", { connection: redisConfig });
module.exports = shippingQueue;
