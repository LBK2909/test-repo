const httpStatus = require("http-status");
const catchAsync = require(__basedir + "/utils/catchAsync");
const { Organization, Plan, Subscription, Transaction, Invoice } = require(__basedir + "/models");
const { createOrderRazorPay, createOrder } = require("./paymentGateway/razorPay.controller");
const { createOrderStripe } = require("./paymentGateway/stripe.controller");
const moment = require("moment");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { imageToBase64 } = require(__basedir + "/utils/util.js");
var fs = require("fs");
const CustomError = require(__basedir + "/utils/customError");
const organizationService = require(__basedir + "/services/organization.service");
const { ObjectId } = require("mongodb"); // Ensure ObjectId is imported

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
    let amount = (plan.price * 100).toFixed(2);
    let orderObj = {
      amount: parseFloat(amount),
      currency: plan.currency,
      metadata: {
        planId: planId,
        orgId: orgId,
        orderCount: plan.orderCount,
      },
    };
    // Forward the request to Stripe
    paymentIntent = await createOrderStripe(orderObj);
    res.status(200).json({
      success: true,
      message: "Payment initiated with Stripe.",
      clientSecret: paymentIntent?.clientSecret || null,
      gateway: "Stripe",
      plan,
      paymentIntent,
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
  // let { orders, additionalOrdersCount } = req.body;
  const { additionalOrdersCount } = req.body; // Get plan_id from request body

  let organizationId = parseInt(req.cookies["orgId"]) || null;
  if (!organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization ID is required" });
  }
  let organization = await Organization.findById(organizationId);
  if (!organization) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "Organization not found" });
  }
  let planObj = await organizationService.getOrganizationSubscription(organizationId);
  let planId = planObj?.planId?._id || null;
  // planId = planId.toString();
  // console.log({ planId });
  const plan = await Plan.findById(planId);
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: "Plan not found.",
    });
  }

  let orgBillingAddress = organization.billingAddress;
  // Step 3: Query the Organization collection with org_id
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

  let paymentIntent;
  if (plan.currency === "INR") {
    let amount = (additionalOrdersCount * plan.additionalOrderPrice * 100).toFixed(2);
    //create order from razorpay gateway
    createOrderRazorPay(amount);
  } else if (plan.currency === "USD") {
    let amount = (additionalOrdersCount * plan.additionalOrderPrice * 100).toFixed(2);

    let orderObj = {
      amount: parseFloat(amount),
      currency: plan.currency,
      metadata: {
        planId: plan._id,
        orgId: organizationId,
        orderCount: additionalOrdersCount,
        activeSubscriptionId: organization.activeSubscription.toString(),
      },
    };
    //create order from razorpay gateway
    paymentIntent = await createOrderStripe(orderObj);

    res.status(200).json({
      clientSecret: paymentIntent?.clientSecret || null,
      success: true,
      message: "Payment initiated with Stripe.",
      paymentIntent,
      gateway: "Stripe",
      plan,
      activeSubscriptionId: organization.activeSubscription,
    });
  }
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
exports.handleSuccessOrder = async (paymentObj) => {
  try {
    let paymentObjmetadata = paymentObj.metadata;
    let planId = paymentObjmetadata.planId;
    const plan = await Plan.findById(planId);
    let orgId = paymentObjmetadata.orgId;
    let orderCount;
    let subscriptionId;
    let isAddonsOrder = false;
    const subscriptionDetails = {
      plan,
      orgId,
    };
    if (paymentObjmetadata.activeSubscriptionId) {
      // existing subscription - adding additional orders
      subscriptionId = paymentObjmetadata.activeSubscriptionId;
      orderCount = paymentObjmetadata.orderCount;
      isAddonsOrder = true;
    } else {
      //update subscription details
      let subscription = await addSubscription(subscriptionDetails);
      subscriptionId = subscription._id;
      orderCount = plan.orderCount;
    }
    const transactionDetails = {
      plan,
      subscriptionId,
      paymentObj,
      orgId,
    };
    let transaction = await addTransaction(transactionDetails);
    // Update organization details
    const updateOrgDetails = {
      subscriptionId,
      orderCount,
      orgId,
      isAddonsOrder,
    };
    let organization = await updateOrganization(updateOrgDetails);
    let billingDetails = {
      plan,
      orderCount,
      transaction,
      organization,
    };
    let billing = await generateBilling(billingDetails);
    //send email to user
  } catch (err) {
    console.log(err);
  }
};

const addTransaction = async (transactionDetails) => {
  try {
    let { plan, subscriptionId, paymentObj, orgId } = transactionDetails;
    // Extract necessary fields from the obj parameter
    const { paymentId, paymentGateway, currency, amount } = paymentObj;

    // Extract the organization ID and subscription ID
    // let subscriptionId = subscription ? subscription._id : null; // Subscription ID (optional)
    orgId = parseInt(orgId) || null;
    subscriptionId = new mongoose.Types.ObjectId(subscriptionId); // Ensure planId is ObjectId

    // Create a new transaction document
    const transaction = new Transaction({
      orgId: orgId,
      subscriptionId: subscriptionId,
      price: parseInt(amount) / 100, // Convert amount to Decimal128
      currency: currency, // Default to USD if currency is not provided
      type: "payment", // Default to "payment"
      status: "completed", // Default to "pending" if status is not provided
      paymentId: paymentId, // Reference to the payment method used
      paymentGateway: paymentGateway,
      transactionDate: new Date(), // Use the current date for transactionDate
    });

    // Save the transaction to the database
    await transaction.save();

    return transaction;
  } catch (err) {
    console.log(err);
  }
};

const addSubscription = async (subscriptionDetails) => {
  try {
    let { plan, orgId } = subscriptionDetails;
    // Define the start date as the current date using moment
    const startDate = moment();

    // Define the end date based on the billing cycle using moment
    let endDate;
    if (plan.billingCycle === "monthly") {
      endDate = moment(startDate).add(1, "months"); // Add 1 month for monthly plans
    } else if (plan.billingCycle === "annual") {
      endDate = moment(startDate).add(1, "years"); // Add 1 year for annual plans
    } else {
      throw new Error("Invalid billing cycle");
    }

    const planObjectId = new mongoose.Types.ObjectId(plan._id); // Ensure planId is ObjectId

    // Create a new subscription document
    const subscription = new Subscription({
      orgId: orgId, // Convert orgId to integer
      planId: planObjectId,
      startDate: startDate.toDate(), // Convert moment to native Date object
      endDate: endDate.toDate(), // Convert moment to native Date object
      billingCycle: plan.billingCycle,
      orderCount: plan.orderCount || 0, // Assuming the plan has an orderLimit field
    });

    // Save the subscription document to the database
    await subscription.save();

    return subscription;
  } catch (err) {
    console.log(err);
  }
};

exports.unsubscribe = catchAsync(async (req, res) => {
  res.send({ message: "unsubscribe from plan" });
});
const updateOrganization = async (updateOrgDetails) => {
  try {
    const { subscriptionId, orderCount, orgId, isAddonsOrder } = updateOrgDetails;
    // Find the organization by orgId
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Update the organization's planId with the new planId
    // organization.planId = planId;
    organization.activeSubscription = subscriptionId;
    if (isAddonsOrder) {
      organization.orderCount += orderCount;
    } else {
      organization.orderCount = orderCount;
    }
    // Save the updated organization to the database
    await organization.save();
    return organization;
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error;
  }
};
const generateBilling = async (billingDetails) => {
  try {
    let { plan, transaction, organization } = billingDetails;

    // Create a new invoice document
    const invoice = new Invoice({
      orgId: transaction.orgId,
      transactionId: transaction._id,
      amount: transaction.price,
      currency: transaction.currency,
      issuedAt: new Date(),
      pdfURL: "",
      status: "paid",
    });

    // Save the invoice to the database
    await invoice.save();

    let invoiceDetails = {
      invoice,
      organization,
      plan,
      transaction,
    };
    let invoicePdfFile = await generateInvoicePDF(invoiceDetails);
    let s3BucketURL = await uploadToS3Bucket(invoicePdfFile);
    //update the invoice with pdf url
    await Invoice.findByIdAndUpdate(invoice._id, { pdfURL: s3BucketURL });
  } catch (error) {
    console.error("Error generating billing:", error);
    throw error;
  }
};

const generateInvoicePDF = async (invoiceDetails) => {
  let { invoice } = invoiceDetails;
  try {
    let html = await generateTemplate(invoiceDetails);
    let timestamp = new Date().getTime();
    let id = invoice._id;
    var invoiceFilePath = `invoice_${id}_${timestamp}.pdf`;
    let browser;
    if (process.env.NODE_ENV === "production") {
      browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium-browser", // Path to the installed Chromium binary
        headless: true, // Runs Chromium in headless mode (without a GUI)
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // Additional arguments to run Chromium in a server environment
      });
    } else {
      browser = await puppeteer.launch();
    }
    const page = await browser.newPage();

    let emptyPDF = await createEmptyPDF(invoiceFilePath)
      .then((res) => {
        return res;
      })
      .catch((error) => {
        console.error("PDF creation failed:", error);
        return false;
      });
    if (!emptyPDF) {
      return {};
    }
    // Set the generated HTML content to Puppeteer's page
    await page.setContent(html, { waitUntil: "load" });

    let isPdfGenerated = await page
      .pdf({
        path: invoiceFilePath,
        format: "A4",
      })
      .then((pdfBuffer) => {
        // console.log("PDF Buffer:-", pdfBuffer);
        return true;
      })
      .catch((error) => {
        console.log("error in generating pdf", error);
        return false;
      });

    await browser.close();
    if (!isPdfGenerated) throw new CustomError(500, "Failed to generate shipping label");
    return invoiceFilePath;
  } catch (err) {
    console.log("Error generating PDF:", err);
    throw new Error("Failed to generate PDF");
  }
};

const generateTemplate = async (invoiceDetails) => {
  let { plan, transaction, invoice, organization } = invoiceDetails;
  const assetsDir = path.join(process.cwd(), "src/assets");
  const BrandLogoImagePath = path.join(assetsDir, "cobay.png");
  const base64Image = await imageToBase64(BrandLogoImagePath);
  const headerImage = base64Image;
  return `
 <!DOCTYPE html>
<html lang="en">

  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        font-family: "Roboto", sans-serif;
        color: #333;
        width: 210mm;
        height: 297mm;
        margin: 0;
      }
      .invoice-box {
        max-width: 850px;
        margin: auto;
        padding: 20px;
        border: 1px solid #eee;
        background-color: #f9f9f9;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        font-size: 14px;
        color: #555;
        height: -webkit-fill-available;
      }
      .header {
        display: flex;
        justify-content: space-between;
      }
      .header .title {
        font-size: 28px;
        font-weight: bold;
      }
      .invoice-info {
        margin-bottom: 40px;
      }
      .invoice-info div {
        margin-bottom: 5px;
      }
      .table-heading {
        background-color: #f0f0f0;
        padding: 10px;
        border: 1px solid #ddd;
        font-weight: bold;
        text-align: left;
      }
      .table-item {
        padding: 10px;
        border-bottom: 1px solid #ddd;
      }
      .total {
        margin-top: 20px;
        text-align: right;
        font-size: 18px;
        font-weight: bold;
      }
      .billing-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 40px;
      }
      .price-table {
        margin-bottom: 40px;
      }
      .price-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }

  .price-table th,
  .price-table td {
    border: 1px solid #000;
    padding: 4px;
    text-align: left;
    font-size: 10px !important;
  }

  .price-table th,
  .price-table td {
    text-align: center;
  }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <div class="header">
        <div>
          <img src="${headerImage}" alt="Company Logo" width="100" />
        </div>
        <div class="title">Invoice</div>
      </div>
      <div class="invoice-info">
        <div><strong>Invoice #:</strong> ${invoice?._id}</div>
        <div><strong>Issue Date:</strong> ${moment(invoice.issuedAt).format("MMMM Do YYYY")}</div>
      </div>
      <div class="billing-info">
        <div>
          <strong>From:</strong><br />
          Cobay Inc.<br />
          10 Schalks Crossing Rd,<br />
          Plainsboro, <br />
          NJ 08536, USA<br />
        </div>
        <div>
          <strong>Bill To:</strong><br />
          ${organization?.organizationName}<br />
        </div>
      </div>
      <table class="price-table">
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
        <tr class="table-item">
          <td>${formatName(plan.name) || "Plan"}</td>
          <td>${transaction?.price}  <span style="text-transform: uppercase">${transaction?.currency}</span></td>
        </tr>
      </table>
      <div class="total">Total: ${transaction?.price}  <span style="text-transform: uppercase">${
    transaction?.currency
  } </span></div>
    </div>
  </body>
</html>

`;
};

async function uploadToS3Bucket(filePath) {
  try {
    // console.log("upload to s3 bucket".blue.bold);
    const CREDENTIALS = {
      accessKeyId: process.env.AWS_PROG_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_PROG_SECRET_ACCESS_KEY,
    };
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: CREDENTIALS,
    });

    const fileContent = await fs.promises.readFile(filePath);
    const uploadParams = {
      Bucket: process.env.S3_INVOICE_BUCKET_NAME,
      Key: filePath,
      Body: fileContent,
      ContentType: "application/pdf",
    };
    const uploadCommand = new PutObjectCommand(uploadParams);
    let s3clientRes = await s3Client
      .send(uploadCommand)
      .then((res) => {
        // console.log(res);
        return true;
      })
      .catch((err) => {
        console.log(err);
        return false;
      });
    await deleteLocalFile(filePath);

    if (s3clientRes) {
      return `https://${process.env.S3_INVOICE_BUCKET_NAME}.s3.amazonaws.com/${filePath}`;
    } else {
      throw new CustomError(500, "Failed to upload file to S3 bucket");
    }
  } catch (err) {
    console.log(err);
    throw new CustomError(500, "Failed to upload file to S3 bucket");
  }
}
async function deleteLocalFile(filePath) {
  try {
    fs.unlinkSync(filePath);
    // console.log(`Local file deleted successfully: ${filePath}`);
  } catch (error) {
    throw new Error("An error occurred while deleting local file");
  }
}
async function createEmptyPDF(filePath) {
  const pdfContent = Buffer.from("%PDF-1.4\n");
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, pdfContent, (err) => {
      if (err) {
        console.error("Error creating PDF file:", err);
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

function formatName(name) {
  if (!name) return "";
  return name.split("_")[0];
}
