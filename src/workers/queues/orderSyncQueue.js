const { Queue } = require("bullmq");
const redisConfig = require("../../config/redis");
const orderSyncQueue = new Queue("orderSync", { connection: redisConfig });
module.exports = orderSyncQueue;
