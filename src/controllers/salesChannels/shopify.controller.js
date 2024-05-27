const catchAsync = require("../../utils/catchAsync.js");
const ShopifyService = require("../../services/channel/shopify.service.js");

async function syncOrders(req, res) {
  try {
    let shopId = req.params.shopId;
    console.log("sync orders method controller...");
    const data = await ShopifyService.initiateSyncingProcess(shopId);
    console.log(data);
    res.json(data);
  } catch (error) {
    console.log(error);
    // Handle any errors
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  syncOrders,
};