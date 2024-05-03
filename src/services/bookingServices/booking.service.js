const { Job } = require("../../models");
const mongoose = require("mongoose");
async function delhiveryCourier(jobData) {
  try {
    let { jobId } = jobData;
    let docs = await Job.findOneAndUpdate(
      { _id: jobId },
      { $set: { status: "processing" }, $inc: { "summary.completedOrders": 1 } },
      { new: true }
    )
      .then((data) => {
        return data;
      })
      .catch((err) => {
        console.log("error in delhiveryCourier service...", err);
      });
  } catch (err) {
    console.log("error in delhiveryCourier service...", err);
  }
  return;
}

async function wayBillGeneration() {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://staging-express.delhivery.com/waybill/api/fetch/json/",
    headers: {
      Authorization: "Token ad0909fbe983d4c0e26bfa49051a9dbfc7d8bb81",
      Cookie: "sessionid=br7sthmpnh5lcoow4gd0sebdkbtxuz4q",
    },
  };

  return axios
    .request(config)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
    });
}

async function labelGeneration() {
  let wayBillNumber = await wayBillGeneration();

  let data = {
    shipments: [
      {
        add: "No-12,Ramasamy layout street,Opposite to Gowtham tower,vilankurichi road. ,",
        address_type: "home",
        phone: "+916381515880",
        payment_mode: "Prepaid",
        name: "Madhushree K",
        pin: 641035,
        order: "ORI27994",
        consignee_gst_amount: "",
        integrated_gst_amount: "",
        ewbn: "",
        consignee_gst_tin: "",
        seller_gst_tin: "",
        client_gst_tin: "",
        hsn_code: "",
        gst_cess_amount: "",
        shipping_mode: "Surface",
        client: "FouviSURFACE-B2C",
        tax_value: "",
        seller_tin: "",
        seller_gst_amount: "",
        seller_inv: "",
        city: "Coimbatore",
        commodity_value: "",
        weight: 1770,
        return_state: "Tamil Nadu",
        document_number: "",
        od_distance: "",
        sales_tax_form_ack_no: "",
        document_type: "",
        seller_cst: "",
        seller_name: " Fouvi Technology Private Limited",
        fragile_shipment: "true",
        return_city: "Coimbatore",
        return_phone: "9043338812",
        shipment_height: 16,
        shipment_width: 17,
        shipment_length: 33,
        category_of_goods: "Assorted Sweets and Snacks",
        cod_amount: 0,
        return_country: "India",
        document_date: "2024-02-17 18:09:17",
        taxable_amount: "",
        products_desc: "OORLA",
        state: "Tamil Nadu",
        dangerous_good: "False",
        waybill: wayBillNumber,
        consignee_tin: "",
        order_date: "2024-02-17 18:09:17",
        return_add:
          "Fouvi Technology Private Limited, 15-2,15-3, Housing Board Road, Kovaipudhur Road, Coimbatore, Tamil Nadu, India",
        total_amount: 1699,
        seller_add: "15-2,15-3,Housing Board Road,Coimbatore - 641042,Tamil Nadu, India",
        country: "India",
        return_pin: "641042",
        extra_parameters: {
          return_reason: "",
        },
        return_name: "Fouvi Technology Private Limited",
        supply_sub_type: "",
        plastic_packaging: "false",
        quantity: 1,
      },
    ],
    pickup_location: {
      name: "Fouvi SURFACE",
      city: "Coimbatore",
      pin: "641042",
      country: "India",
      phone: "9043338812",
      add: "Fouvi Technology Private Limited, 15-2,15-3, Housing Board Road, Kovaipudhur Road, Coimbatore, Tamil Nadu, India",
    },
  };
  let jsonData = JSON.stringify(data);
  let queryString = `format=json&data=${jsonData}`;

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://staging-express.delhivery.com/api/cmu/create.json",
    headers: {
      Authorization: "Token ad0909fbe983d4c0e26bfa49051a9dbfc7d8bb81",
      "Content-Type": "text/plain",
      Cookie: "sessionid=ze4ncds5tobeyynmbb1u0l6ccbpsmggx; sessionid=br7sthmpnh5lcoow4gd0sebdkbtxuz4q",
    },
    data: queryString,
  };
  axios
    .request(config)
    .then((response) => {})
    .catch((error) => {
      console.log(error);
    });
}

module.exports = { delhiveryCourier };
