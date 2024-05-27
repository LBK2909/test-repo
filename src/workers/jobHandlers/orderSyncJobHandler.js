// const { fetchOrders } = require("../../services/channel/shopify.service");
const CHANNEL = {
  shopify: require("../../services/channel/shopify.service"),
};
const orderSyncJobHandler = async (job) => {
  try {
    console.log("order sync job handler...");
    let shop = job?.data || null;
    let channel = shop?.channel || null;
    let jobName = job?.name || null;
    console.log("job name==", jobName);
    // console.log("channel==", CHANNEL);
    // console.log("channel==", CHANNEL["shopify"]);
    // console.log("channel module==", CHANNEL?.[jobName]);
    const channelModule = CHANNEL?.[jobName];
    console.log("channelModule", channelModule);
    if (channelModule && typeof channelModule.fetchOrders === "function") {
      await channelModule.fetchOrders(shop);
    } else {
      console.error(`Invalid channel or initiateSyncingProcess method not found: ${channel}`);
    }
  } catch (err) {
    console.error("Error processing shipping job:", err);
    await job.moveToFailed(err, true);
  }
};

module.exports = orderSyncJobHandler;
