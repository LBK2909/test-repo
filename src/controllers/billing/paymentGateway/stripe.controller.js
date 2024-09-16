const Stripe = require("stripe");
const catchAsync = require(__basedir + "/utils/catchAsync");
const httpStatus = require("http-status");
const stripe = Stripe(
  "sk_test_51PtOpXP9ujEXTTa21yqUHfEbzV7wPdF5bug7W8HtoFWcbwv1dRQ0OKkd75PZ2H0aIPwW3M69jcr0HLkOjn37phfS00blFULL9u"
);
const { stripeOrder } = require(__basedir + "/models");
const CustomError = require(__basedir + "/utils/customError");
const billingController = require("../index");
// const { subscribe } = require(__basedir + "/controllers/billing/index");

// Create a new order
exports.createOrderStripe = async (plan) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create(plan);
    // Save essential payment intent details to MongoDB
    const paymentIntentData = {
      _id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      livemode: paymentIntent.livemode,
      receipt_email: paymentIntent.receipt_email,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
    };

    let order = await stripeOrder.create(paymentIntentData);
    if (!paymentIntent.client_secret) {
      throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Payment Intent creation failed");
    }
    return order;
    // paymentIntent?.client_secret || null;
  } catch (error) {
    console.error("Error creating order:", error.message);
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

exports.getPaymentIntentDetails = catchAsync(async (req, res) => {
  try {
    const { paymentIntentId } = req.params; // Retrieve the paymentIntentId from the request parameters

    if (!paymentIntentId) {
      return res.status(httpStatus.BAD_REQUEST).send({ message: "Payment Intent ID is required" });
    }
    // Call Stripe API to retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // Update the payment intent in the database based on the Stripe response
    const updatedPaymentIntentData = {
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
      livemode: paymentIntent.livemode,
      receipt_email: paymentIntent.receipt_email,
      description: paymentIntent.description,
      metadata: paymentIntent.metadata,
    };

    // Update the record in MongoDB using the paymentIntent ID
    let updated = await stripeOrder.findByIdAndUpdate(paymentIntentId, updatedPaymentIntentData, { new: true, upsert: true });

    // Send the payment intent details as a response
    res.status(200).send(paymentIntent);
  } catch (error) {
    // Handle any errors (e.g., invalid ID, network issues)
    console.error("Error retrieving payment intent:", error.message);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment intent",
      error: error.message,
    });
  }
});
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  try {
    // Logic to handle successful payment intent
    // console.log("PaymentIntent succeeded:", paymentIntent);
    const obj = await stripeOrder.findOne({ _id: paymentIntent.id });
    const paymentObj = {
      ...obj.toObject(),
      paymentId: paymentIntent.id,
      paymentGateway: "stripe",
    };
    // Call the billingController to handle the success order
    billingController.handleSuccessOrder(paymentObj);
  } catch (error) {
    console.error("Error handling payment intent:", error.message);
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  // Simple operation: Add the payment intent ID to the store
};

const handlePaymentMethodAttached = (paymentMethod) => {
  // Logic to handle successfully attached payment method
  console.log("PaymentMethod attached:", paymentMethod);
  // Simple operation: Add the payment method ID to the store
};

exports.handleWebhookEvent = async (event) => {
  console.log("handleWebhookEvent method...:====");
  // console.log(event);
  let eventObj = event?.data?.object || null;
  let eventType = event?.type || null;
  if (!eventType) {
    console.log("Invalid event type");
    return;
  }
  switch (event.type) {
    case "payment_intent.succeeded":
      handlePaymentIntentSucceeded(event?.data?.object);
      break;
    case "payment_method.attached":
      handlePaymentMethodAttached(event.data.object);
      break;
    // Handle other event types here
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};

exports.handleStripeWebhook = async (req, res) => {
  const endpointSecret = "whsec_ocZBkt8mEhYpQh8xWLswASu2DBTvYdly"; // Replace with your actual endpoint secret
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify the webhook signature and extract the event
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(event.data);
  } catch (err) {
    // If verification fails, return a 400 error
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Pass the verified event to the controller method for handling
  await exports.handleWebhookEvent(event);

  // Return a response to acknowledge receipt of the event
  return res.json({ received: true });
};

exports.testSubscribe = async (red) => {
  billingController.subscribe();
};
