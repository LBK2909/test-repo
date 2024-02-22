const express = require("express");

const shippingController = require("../controllers/shipping.controller");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/test-shipping", shippingController.delhiveryCourier);

module.exports = router;
