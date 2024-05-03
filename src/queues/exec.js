const { startWorker } = require("./worker");

setTimeout(() => {
  startWorker();
}, 1000);
