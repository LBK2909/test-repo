const { Worker } = require("bullmq");
global.__basedir = __dirname;
const { shippingQueue, orderSyncQueue } = require(__basedir + "/workers/queues/index.js");
const redisConfig = require(__basedir + "/config/redis.js");

require(__basedir + "/config/logger.js");

const connectDB = require(__basedir + "/config/db.js");
const { shippingJobHandler, orderSyncJobHandler } = require(__basedir + "/workers/jobHandlers/index.js");
connectDB();

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
