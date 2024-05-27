const { startWorkers } = require("./startWorkers.js");

setTimeout(() => {
  console.log("Starting workers... execution js");
  startWorkers();
}, 1000);
