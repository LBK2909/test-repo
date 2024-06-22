const axios = require("axios");
const bwipjs = require("bwip-js");
var html_to_pdf = require("html-pdf-node");
const QRCode = require("qrcode");
var fs = require("fs");
const Delhivery = require("../../integrations/courierPartners/delhivery.js");
const { updateJobStatus, updateOrderStatus } = require("../../utils/db.js");
const CustomError = require("../../utils/customError");
const { Order, OrganizationCourier, Organization } = require("../../models");
const { Shop } = require("../../models/shop.model");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const path = require("path");
const { AsyncResource } = require("async_hooks");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const colors = require("colors");

async function createShipment(order, job = null) {
  try {
    // console.log(order.courierPartner);
    if (!order.orderId) throw new CustomError(400, "Order Id is required");
    updateOrderStatus(order._id, { status: "processing" });
    let courierEndPoints = order.shippingService?._id?.courierId?.endpoints || {};
    let isProductionEnviroment = order.shippingService?._id?.isProductionEnvironment || false;
    let rootUrl = getRootURL(courierEndPoints, isProductionEnviroment);
    let credentials = order.shippingService?._id?.credentials || {};
    const delhiveryCourier = new Delhivery(credentials, rootUrl, order);
    let shipmentResponse = await delhiveryCourier.initiateBooking();
    let shippingLabelResponse = await createShippingLabel(order);
    let uploadFileResponse = await uploadToS3Bucket(shippingLabelResponse);
    await updateShipmentStatus(shipmentResponse, uploadFileResponse);
    if (job) {
      await updateJobStatus(job, "completedOrders");
    }
  } catch (err) {
    console.log("error in createShipment service...", err);
    updateOrderStatus(order._id, { status: "pending" });
    updateOrderStatus(order._id, { "courierDetails.bookingStatus": "failed", "courierDetails.bookingInfo": err.message });
    if (job) {
      updateJobStatus(job, "failedOrders");
    } else {
      throw new CustomError(500, err);
    }
  }
}

async function updateShipmentStatus(response, uploadFileResponse) {
  const { order, shipmentResponse } = response || {};
  let awbURL = "";
  let bookingStatus = "";
  let errMessage = "";
  if (uploadFileResponse.isCreated && uploadFileResponse.url) {
    awbURL = uploadFileResponse.url;
  }
  // Validate request body
  if (!order?._id || !shipmentResponse) {
    throw new CustomError(400, "Missing orderId or shipmentResponse");
  }

  // Extract necessary information from the shipment response
  const packageInfo = shipmentResponse?.packages[0] ?? null;
  if (!shipmentResponse.success || !packageInfo) {
    bookingStatus = "failed";
  } else {
    bookingStatus = "booked";
  }
  const updatedDetails = {
    "courierDetails.name": order.courierPartner?.courierId?.name,
    "courierDetails.trackingNumber": packageInfo?.waybill,
    "courierDetails.trackingUrl": packageInfo?.waybill ? `https://www.delhivery.com/track/package/${packageInfo?.waybill}` : null,
    "courierDetails.estimatedDeliveryDate": null, // Add logic to estimate delivery date if available
    "courierDetails.shippingMethod": packageInfo?.payment,
    "courierDetails.shippingCost": shipmentResponse.cod_amount,
    "courierDetails.carrierCode": shipmentResponse.sort_code,
    "courierDetails.bookingStatus": bookingStatus, // Assuming status from response can be mapped directly
    "courierDetails.bookingInfo": JSON.stringify(packageInfo?.remarks) || shipmentResponse.rmk,
    "courierDetails.shippedAt": null,
    "courierDetails.deliveredAt": null,
    "courierDetails.bookedAt": new Date(),
    "courierDetails.shippingLabel": awbURL || "",
    status: bookingStatus === "booked" ? "booked" : "pending",
    updatedAt: new Date(),
  };

  // Update the order
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id },
    {
      $set: updatedDetails,
    }
  )
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.log(err);
      return null;
    });

  if (!updatedOrder || !packageInfo || bookingStatus !== "booked") {
    let message = shipmentResponse?.rmk || "failed to update the order";
    let statusCode = shipmentResponse?.rmk ? 401 : 500;
    throw new CustomError(statusCode, message);
  }
  return response;
}

async function generateBarcode(awbNumber, retryCount = 0) {
  try {
    // Use the provided awbNumber parameter instead of a hardcoded value
    const waybill = awbNumber.toString();

    // Define a function to generate the barcode
    const generateBarcodeBuffer = () => {
      return new Promise((resolve, reject) => {
        bwipjs.toBuffer(
          {
            bcid: "code128",
            text: waybill,
            scale: 3,
            height: 8,
            includetext: true,
            textxalign: "center",
          },
          function (err, png) {
            if (err) {
              return reject(err);
            } else {
              const base64String = png.toString("base64");
              const dataUrl = `data:image/png;base64,${base64String}`;
              return resolve(dataUrl);
            }
          }
        );
      });
    };

    try {
      // Attempt to generate the barcode buffer
      return await generateBarcodeBuffer();
    } catch (err) {
      console.error(`Attempt ${retryCount + 1}: Error generating barcode`, err);
      if (retryCount < 5) {
        // Retry with an incremented retry count
        return await generateBarcode(awbNumber, retryCount + 1);
      } else {
        // Maximum retries reached, return an error message
        return {
          error: "Max retries reached. Unable to generate barcode.",
        };
      }
    }
  } catch (error) {
    // Catch any other unexpected errors
    console.error("Unexpected error in generateBarcode:", error);
    return {
      error: "Unexpected error occurred. Unable to generate barcode.",
    };
  }
}

async function createQRCode(orderId, width = 55, height = 40) {
  try {
    let orderNumber = orderId.toString();
    let qrGenerated = await QRCode.toDataURL(orderNumber, { width, height });
    return qrGenerated;
  } catch (err) {
    console.error(err);
  }
}

// Generate the shipping label content
const generateShippingLabelContent = async (data, page) => {
  try {
    let awbBarcode = await generateBarcode(data?.orderDetails?.trackingNumber);
    const imageToBase64 = (filePath) => {
      const image = fs.readFileSync(filePath);
      return `data:image/png;base64,${image.toString("base64")}`;
    };
    const assetsDir = path.join(process.cwd(), "src/assets");
    const BrandLogoImagePath = path.join(assetsDir, "cobay.png");
    const base64Image = await imageToBase64(BrandLogoImagePath);
    const footerImage = base64Image;

    const header = `
    <div class="header ship-to-header">
      <div class="address">
        <strong>Ship To</strong><br>
        <div>
        ${data.shipTo.name}<br>
        </div>
        <div>
        ${data.shipTo.address}<br>
        </div>
      </div>
      <div class="logo">
        <img src="${data.shipTo.companyLogo || ""}" width='50' height='50' alt="log Logo">
      </div>
    </div>
  `;
    const orderDetails = `
    <div class=" flex-row-center border-line" >
    <div class="order-details">
      <div><strong>Dimensions:</strong> ${data.orderDetails.dimensions}</div>
      <div><strong>Payment:</strong> <span style="font-weight: bold;">${data.orderDetails.paymentMode}</span></div>
      <div><strong>Price:</strong> ${data.orderDetails.totalPrice}</div>
      <div><strong>Weight:</strong> ${data.orderDetails.weight}</div>
      <div><strong>Order No.:</strong> ${data.orderDetails.orderNo}</div>
    </div>
    <div class="barcode-section">
      <img src=${awbBarcode} alt="Barcode"  width='200' height='50'/>
    </div>
  </div>
  `;

    const returnAddress = `
    <div class="section return-address" style='margin-top:5px;'>
      <div class="address">
        <strong>Shipped By (If undelivered, return to)</strong><br>
        <div>
        ${data.returnTo.name}<br>
        </div>
        <div>
        ${data.returnTo.address}<br>
        </div>
       
      </div>
    </div>
  `;

    const barcodeSection = `
    <div class="section barcode">
      <strong>Order #: ${data.orderNumber}</strong><br>
      <img src="barcode.png" alt="Barcode"><br>
      Invoice No.: ${data.invoiceNumber}<br>
      Invoice Date: ${data.invoiceDate}
    </div>
  `;

    const footer = `
    <div class="footer note" >
      All disputes are subject to Tamil Nadu jurisdiction only. Goods once sold will only be taken back or exchanged as per the store's exchange/return policy.
      <div style='display:flex;flex-direction:column;justify-content:flex-end;align-items:flex-end'>
      <img src="${footerImage}" width='50' height='50' alt="log Logo">
      </div>
    </div>
  `;

    const productTableHeader = `
    <thead>
      <tr>
        <th>Product Name </th>
        <th>Qty</th>
        <th> Price</th>
      </tr>
    </thead>
    <tbody>
  `;

    let pages = [];
    let currentPage = `<div class="page">${header}${orderDetails}${returnAddress}<table class="product-info">${productTableHeader}`;

    // Initial page setup
    await page.setContent(currentPage + "</tbody></table></div>");
    let currentPageHeight = await page.evaluate(() => document.querySelector(".page").scrollHeight);

    for (let product of data.products) {
      const productRow = `
      <tr>
        <td>${product.name}</td>
        <td>${product.qty}</td>
        <td>${product.unitPrice.toFixed(2)}</td>
      </tr>
    `;

      // Temporarily add the row to check if it fits in the current page
      await page.setContent(currentPage + productRow + "</tbody></table></div></div>");
      const newHeight = await page.evaluate(() => document.querySelector(".page").scrollHeight);
      const A6_PAGE_HEIGHT = 500;
      if (newHeight > A6_PAGE_HEIGHT) {
        // Assuming page height limit
        // If the row causes overflow, finalize the current page and start a new one
        pages.push(currentPage + `</tbody></table>` + footer + `</div>`);
        currentPage = `<div class="page">${header}<table class="product-info">${productTableHeader}${productRow}`;
        await page.setContent(currentPage + "</tbody></table></div>");
        currentPageHeight = await page.evaluate(() => document.querySelector(".page").scrollHeight); // Update height for the new page
      } else {
        // If the row fits, add it to the current page
        currentPage += productRow;
        currentPageHeight = newHeight;
      }
    }

    currentPage += "</tbody></table>" + footer + `</div>`;
    pages.push(currentPage);
    let html = pages.map((page) => `${page}`).join("");

    return html;
  } catch (err) {
    console.log(err);
    throw new CustomError(500, err);
  }
};
async function uploadToS3Bucket(file) {
  try {
    if (file.isCreated) {
      let filePath = file.url;
      // console.log("upload to s3 bucket".blue.bold);
      const CREDENTIALS = {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECERT_KEY,
      };
      const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: CREDENTIALS,
      });

      const fileContent = await fs.promises.readFile(filePath);
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
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
        return {
          isCreated: true,
          url: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${filePath}`,
        };
      } else {
        throw new CustomError(500, "Failed to upload file to S3 bucket");
      }
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
const createShippingLabel = async (order) => {
  const styles = `
<style>
  @page {
    size: A6;
    margin: 0;
  }
  body {
    font-family: Arial, sans-serif;
    font-size: 10px !important;
    margin: 0;
    padding: 0;
  }
  .page {
    page-break-after: always;
    border: 1px solid #000;
    padding: 10px; /* Adjust padding if necessary */
    display: flex;
    flex-direction: column;
    height:530px
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #000;
    padding: 8px 0;
  }
  .header img {
    max-height:100px;
  }
  .address {
    line-height: 1.2;
  }
  .order-details {
    display: flex;
    flex-direction: column;
    padding: 8px 0;

  }
  .order-details div,.address div, .return-address div {
    margin: 5px 0;
  }
  .product-info {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
  }
  .table-container{
  }
  .product-info th,
  .product-info td {
    border: 1px solid #000;
    padding: 4px;
    text-align: left;
    font-size: 10px !important;
  }
  .product-info th,
  .product-info td {
    text-align: center;
  }
  .note {
    font-size: 8px;
    text-align: center;
  }
  .auto-generated {
    font-size: 7px;
    text-align: center;
  }
  .page-break {
    page-break-before: always;
  }
  .footer {
    padding-top: 10px;
    text-align: center;
    display:flex;
    flex:1;
   justify-content:flex-end;
   align-items:center;
   gap:10px
  }
  .flex-row-center{
    display:flex;
    justify-content:space-between;
    align-items:center;
  }

  .border-line{
    border-bottom:1px solid #000;
  }
</style>
`;
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const shippingData = await createStructuredObj(order);
    const generatedHtml = await generateShippingLabelContent(shippingData, page);
    let orderNumber = order.orderId || "";
    let timestamp = new Date().getTime();
    var shippingLabelFilePath = `awbLabel_${orderNumber}_${timestamp}.pdf`;
    let pageHTML = `
    <html>
      <head>
        ${styles}
      </head>
      <body>
        ${generatedHtml}
      </body>
    </html>
  `;
    let emptyPDF = await createEmptyPDF(shippingLabelFilePath)
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
    await page.setContent(pageHTML, { waitUntil: "networkidle0" });

    let isPdfGenerated = await page
      .pdf({
        path: shippingLabelFilePath,
        format: "A6",
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
    return {
      isCreated: isPdfGenerated,
      url: shippingLabelFilePath,
    };
  } catch (err) {
    console.log(err);
    throw new CustomError(500, "Failed to generate shipping label");
  }
};
function getRootURL(endpoints, isProductionEnvironment) {
  let rootUrl = "";
  if (isProductionEnvironment) {
    rootUrl = endpoints?.production?.rootUrl;
  } else {
    rootUrl = endpoints?.testing?.rootUrl;
  }

  return rootUrl;
}
const createStructuredObj = async (orderObj) => {
  const organization = orderObj.organization || {};
  const displayName = organization.displayName || "";
  const companyLogo = organization.companyLogo || "";
  // Extract necessary fields from orderObj with error handling
  const shipTo = {
    name: `${orderObj?.shippingAddress?.first_name ?? "N/A"} ${orderObj?.shippingAddress?.last_name ?? "N/A"}`,
    address: `${orderObj?.shippingAddress?.address1 ?? ""}, ${orderObj?.shippingAddress?.city ?? ""}, ${
      orderObj?.shippingAddress?.province ?? ""
    }, ${orderObj?.shippingAddress?.country ?? ""} ${orderObj?.shippingAddress?.zip ?? ""}`,
    companyLogo: companyLogo,
  };

  let packageDimensions = orderObj?.courierDetails?.packageDimensions || {};
  let packageEmptyWeight = packageDimensions?.emptyWeight || 0;
  let totalWeightInGrams = orderObj?.totalWeightGrams || 0;
  let totalWeight = parseFloat((totalWeightInGrams + packageEmptyWeight) / 1000) || 0.1;
  const orderDetails = {
    orderNo: `${orderObj?.orderNumber ?? "Unknown Order Number"}`,
    dimensions: `${packageDimensions?.length ?? "N/A"}x${packageDimensions?.width ?? "N/A"}x${
      packageDimensions?.height ?? "N/A"
    }`,
    paymentMode: orderObj?.courierDetails?.paymentMode || "prepaid",
    totalPrice: `${orderObj?.totalPrice ?? "0.00"} INR`,
    weight: `${totalWeight ?? "0"} ${orderObj?.courierDetails?.packageWeight?.unit ?? "KG"}`,
    eWaybill: orderObj?.courierDetails?.eWaybill ?? "N/A",
    logistics: orderObj?.courierDetails?.name ?? "Unknown Logistics",
    trackingNumber: orderObj?.courierDetails?.trackingNumber ?? "Unknown Tracking Number",
    routingCode: orderObj?.courierDetails?.routingCode ?? "NA",
  };
  let billingAddress = organization.billingAddress || {};
  let returnTo = {};
  if (billingAddress && Object.keys(billingAddress).length === 0) {
    returnTo = {
      name: "N/A", // Example fixed return to name
      address: "N/A",
      gstin: "N/A", // Example fixed GSTIN
    };
  }
  returnTo = {
    name: displayName || "N/A", // Example fixed return to name
    address: `${billingAddress.street || "N/A"}, ${billingAddress.city || "N/A"}, ${billingAddress.state || "N/A"},${
      billingAddress.country || "N/A"
    },${billingAddress.zip || "N/A"}`,
    // gstin: "33AAQFD8523K1Z3", // Example fixed GSTIN
  };

  const orderNumber = orderObj?.orderNumber ?? "Unknown Order Number";
  const invoiceNumber = "D15624"; // Example fixed invoice number
  const invoiceDate = "2024-02-21"; // Example fixed invoice date

  // Generate products array based on lineItems with error handling
  const products =
    orderObj?.lineItems?.map((item, i) => ({
      sku: item?.sku ?? i,
      name: item?.name ?? "Unknown Product",
      qty: item?.quantity ?? 0,
      unitPrice: item?.price ?? 0,
    })) ?? [];

  // Return the structured object
  return {
    shipTo,
    orderDetails,
    returnTo,
    orderNumber,
    invoiceNumber,
    invoiceDate,
    products,
  };
};
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
module.exports = { createShipment };
