const express = require("express");

const shippingController = require("../controllers/shipping.controller");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");
const { route } = require("./common.route");

const router = express.Router();

router.post("/shipment-booking", shippingController.shipmentBooking);
router.get("/bulk-shipment-status/:jobId", shippingController.bulkShipmentStatus);
module.exports = router;
