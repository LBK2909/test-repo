const express = require("express");
const { shopifyController } = require("../controllers/salesChannels");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");
const { organizationValidation, validate } = require("../validations/index");

const router = express.Router();

router.get("/sync-shopify-orders/:shopId", shopifyController.syncOrders);

module.exports = router;
