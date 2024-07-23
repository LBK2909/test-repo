// webhook.route.js

const express = require("express");
const crypto = require("crypto");
const { shopifyController } = require("../controllers/index");

const router = express.Router();
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "my_client_secret";

// Middleware to verify Shopify webhook
router.use((req, res, next) => {
  const hmacHeader = req.get("X-Shopify-Hmac-Sha256");
  const data = req.body;
  const calculatedHmac = crypto.createHmac("sha256", CLIENT_SECRET).update(JSON.stringify(data), "utf8").digest("base64");

  if (crypto.timingSafeEqual(Buffer.from(calculatedHmac), Buffer.from(hmacHeader))) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
});

router.post("/customers/redact", shopifyController.webhooksCustomerRedact);
router.post("/customers/data_request", shopifyController.webhooksCustomerDataRequest);
router.post("/shop/redact", shopifyController.webhooksShopRedact);

module.exports = router;
