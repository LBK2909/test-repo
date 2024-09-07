const express = require("express");

const { razorpayController } = require("../../controllers/index");

const router = express.Router();

router.post("/create-order", razorpayController.createOrder);
module.exports = router;
