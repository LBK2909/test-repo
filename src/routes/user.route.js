const express = require("express");

const userController = require("../controllers/user.controller");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

// router.post("/shipment-booking", shippingController.shipmentBooking);
// router.get("/bulk-shipment-status/:jobId", shippingController.bulkShipmentStatus);
router.get("/user", auth.verifyToken, userController.getUser);
module.exports = router;
