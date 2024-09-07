const express = require("express");
const Stripe = require("stripe");
const { stripeController } = require("../../controllers/index");
const stripe = Stripe(
  "sk_test_51PtOpXP9ujEXTTa21yqUHfEbzV7wPdF5bug7W8HtoFWcbwv1dRQ0OKkd75PZ2H0aIPwW3M69jcr0HLkOjn37phfS00blFULL9u"
);
const router = express.Router();

// router.post("/create-order", stripeController.createOrder);
router.get("/payment-intent/:paymentIntentId", stripeController.getPaymentIntentDetails);

router.post("/webhooks", express.raw({ type: "application/json" }), (req, res) => {
  stripeController.handleStripeWebhook(req, res);
});

module.exports = router;
