const Razorpay = require("razorpay");
const CryptoJS = require("crypto-js");
const catchAsync = require("../../../utils/catchAsync");
const httpStatus = require("http-status");
const { Organization } = require("../../../models");

const razorpay = new Razorpay({
  key_id: "rzp_test_edPbHDfFiVy0A9",
  key_secret: "qsivjwULYYwPdv8dR1FA9puk",
});

// Create a new order
exports.createOrder = async (req, res) => {
  let { planId } = req.body;
  console.log({ planId });
  let order = await createOrderAPI(planId);
  res.send({ order });
};

// Handle payment success
exports.paymentSuccess = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  const isValid = validatePaymentVerification(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    "qsivjwULYYwPdv8dR1FA9puk"
  );

  console.log({ isValid });

  if (isValid) {
    res.json({ status: "Payment verified and processed" });
  } else {
    res.status(400).json({ status: "Payment verification failed" });
  }
};

// Handle webhook events
exports.webhook = (req, res) => {
  console.log("Webhook payload:", req.body);
  const secret = "YOUR_WEBHOOK_SECRET";
  const signature = req.headers["x-razorpay-signature"];
  const payload = JSON.stringify(req.body);

  // Uncomment and update to use the validateWebhookSignature function
  // if (validateWebhookSignature(payload, signature, secret)) {
  //   const event = req.body.event;
  //   if (event === "payment.captured") {
  //     const payment = req.body.payload.payment.entity;
  //     console.log("Payment captured:", payment);
  //   }
  //   res.status(200).send("OK");
  // } else {
  //   res.status(400).send("Invalid signature");
  // }
};

function validatePaymentVerification(orderId, paymentId, razorpaySignature, secret) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = CryptoJS.HmacSHA256(body, secret).toString(CryptoJS.enc.Hex);
  return expectedSignature === razorpaySignature;
}
// Define and export the function
exports.createOrderRazorPay = async (amount) => {
  console.log("createOrderAPI function called");
  let order = await createOrderAPI(planId);

  // const options = {
  //   amount: amount, // amount in the smallest currency unit
  //   currency: "INR",
  //   receipt: "receipt_order_74394",
  // };

  // try {
  //   const order = await razorpay.orders.create(options);
  //   console.log(order);
  //   return order;
  // } catch (error) {
  //   throw new Error(`Order creation failed: ${error.message}`);
  // }
};
async function createOrderAPI(planId) {
  console.log("create order api called....");
  const options = {
    amount: 50000, // amount in the smallest currency unit
    currency: "INR",
    receipt: "receipt_order_74394",
  };
  try {
    const order = await razorpay.orders.create(options);
    console.log(order);
    // res.json(order);
    return order;
  } catch (error) {
    res.status(500).send(error);
  }
}
