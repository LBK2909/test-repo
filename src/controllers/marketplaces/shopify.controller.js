const catchAsync = require("../../utils/catchAsync.js");
const ShopifyService = require("../../services/channel/shopify.service.js");

async function syncOrders(req, res) {
  try {
    // Call the abstraction module from Shopify services
    const data = await ShopifyService.fetchOrders("cobay-demo-store.myshopify.com");
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
