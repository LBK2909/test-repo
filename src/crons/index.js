// /cron/index.js
const subscriptionUpdater = require("./subscriptionUpdater.cron");
// Add other cron jobs here as needed

// Start all cron jobs
function startCrons() {
  console.log("Starting cron jobs...");
  subscriptionUpdater();
  // Add other cron jobs like this
}

module.exports = {
  startCrons,
};
