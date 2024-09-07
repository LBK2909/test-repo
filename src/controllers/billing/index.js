const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const { Organization, Plan } = require("../../models");
const { razorpayController } = require("../index");
const { createOrderRazorPay, createOrder } = require("./paymentGateway/razorPay.controller");
const { createOrderStripe } = require("./paymentGateway/stripe.controller");
exports.getPlans = catchAsync(async (req, res) => {
  // Retrieve orgId from cookies
  const orgId = req.cookies["orgId"];

  // Ensure orgId is available
  if (!orgId) {
    return res.status(400).json({
      success: false,
      message: "Organization ID is required in cookies.",
    });
  }

  // Find the organization by orgId
  const organization = await Organization.findById(orgId);
  if (!organization) {
    return res.status(404).json({
      success: false,
      message: "Organization not found.",
    });
  }

  // Get the organization's billing currency
  // const orgCurrency = organization.currency;
  const orgCurrency = "USD";
  // Validate the currency (USD or INR)
  if (orgCurrency !== "USD" && orgCurrency !== "INR") {
    return res.status(400).json({
      success: false,
      message: "Unsupported currency for organization.",
    });
  }

  // Use an aggregation query to filter and sort the plans by price
  const plans = await Plan.aggregate([
    {
      $match: {
        currency: orgCurrency, // Match only the plans with the organization's currency
        isActive: true,
      },
    },
    {
      $sort: {
        price: 1, // Sort by price in ascending order (1 for ascending, -1 for descending)
      },
    },
  ]);

  // Send the sorted and filtered plans as the response
  res.status(200).send(plans);
});

exports.addPlan = catchAsync(async (req, res) => {
  try {
    // Create a new plan with the data from the request body
    const newPlan = await Plan.create(req.body);

    // Send a response with the newly created plan
    res.status(201).json({
      status: "success",
      data: {
        plan: newPlan,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
});

exports.createOrder = catchAsync(async (req, res) => {
  const { planId } = req.body; // Get plan_id from request body
  const orgId = req.cookies["orgId"]; // Get org_id from cookies

  // Step 1: Validate org_id
  if (!orgId) {
    return res.status(400).json({
      success: false,
      message: "Organization ID is required in cookies.",
    });
  }

  // Step 2: Query the Plan collection with plan_id
  const plan = await Plan.findById(planId);
  console.log({ plan });
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Plan not found.",
    });
  }

  // Step 3: Query the Organization collection with org_id
  const organization = await Organization.findById(orgId);
  // let currency = organization.currency || null;
  let currency = "USD";
  if (!organization || !currency) {
    return res.status(404).json({
      success: false,
      message: "Organization or currency not found.",
    });
  }

  // Step 4: Verify if Plan's currency matches Organization's currency
  if (plan.currency !== currency) {
    return res.status(400).json({
      success: false,
      message: "Currency mismatch between Plan and Organization.",
    });
  }

  // Step 5: Forward the request based on the currency
  let paymentIntent;
  if (plan.currency === "USD") {
    let orderObj = {
      amount: plan.price,
      currency: plan.currency,
      metadata: {
        planId: planId,
        orgId: orgId,
      },
    };
    // Forward the request to Stripe
    paymentIntent = await createOrderStripe(orderObj);
    res.status(200).json({
      success: true,
      message: "Payment initiated with Stripe.",
      clientSecret: paymentIntent,
      gateway: "Stripe",
      plan: plan,
    });
  } else if (plan.currency === "INR") {
    // Forward the request to Razorpay
    const instance = new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: plan.price * 100, // Amount in paise for INR
      currency: "INR",
      receipt: `receipt_${plan_id}`,
    });

    res.status(200).json({
      success: true,
      message: "Payment initiated with Razorpay.",
      orderId: order.id,
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Unsupported currency.",
    });
  }
});

exports.createOrderCustomPlan = catchAsync(async (req, res) => {
  let { orders } = req.body;
  let organizationId = parseInt(req.cookies["orgId"]) || null;
  if (!organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization ID is required" });
  }
  let organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization not found" });
  }
  let orgBillingAddress = organization.billingAddress;
  if (orgBillingAddress == "india") {
    let amount = 1000;
    //create order from razorpay gateway
    createOrderRazorPay(amount);
  } else {
    let amount = 100;
    //create order from razorpay gateway
    createOrderRazorPay(amount);
  }
  // let { orders } = req.body;
  res.send({ orders });
});
exports.updatePlan = catchAsync(async (req, res) => {
  res.send({ message: "Update plan" });
});
exports.deletePlan = catchAsync(async (req, res) => {
  res.send({ message: "Delete plan" });
});
exports.getPlan = catchAsync(async (req, res) => {
  res.send({ message: "Get plan" });
});
exports.subscribe = catchAsync(async (req, res) => {
  res.send({ message: "Subscribe" });
});
exports.unsubscribe = catchAsync(async (req, res) => {
  res.send({ message: "unsubscribe from plan" });
});
