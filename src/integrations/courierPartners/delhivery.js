let axios = require("axios");
const CustomError = require("../../utils/customError");
const moment = require("moment");
const { error } = require("winston");

class DelhiveryCourier {
  constructor(credentials, URL, order) {
    // this.accessToken = accessToken;
    this.accessToken = credentials["api_token"];
    this.pickupName = credentials["pickup_name"];
    this.sellerGST_TIN = credentials["seller_GST_TIN"];
    this.rootURL = URL;
    this.order = order;
    this.wayBillNumber = "";
  }

  async initiateBooking() {
    try {
      // Logic to initiate booking using this.accessToken and this.URL
      this.wayBillNumber = await this.generateWaybill();
      let shipmentResponse = await this.createShipment();
      return shipmentResponse;
    } catch (err) {
      throw new CustomError(500, err.message || err);
    }
  }

  async generateWaybill() {
    try {
      let config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${this.rootURL}/waybill/api/fetch/json/`,
        headers: {
          Authorization: `Token ${this.accessToken}`,
        },
      };

      let wayBillResponse = await axios
        .request(config)
        .then((response) => {
          const awbNumber = response.data || "";
          return awbNumber || "";
        })
        .catch((error) => {
          throw new CustomError(500, error);
        });
      return wayBillResponse;
    } catch (error) {
      console.log("error  in catch blcok");
      throw new CustomError(500, error);
    }
  }

  async createShipment() {
    try {
      let organization = this.order.organization || {};
      let packageDimensions = this.order?.courierDetails?.packageDimensions || {};
      let packageEmptyWeight = packageDimensions?.emptyWeight || 0;
      let totalWeightInGrams = this.order?.totalWeight || 0;
      let totalWeight = parseFloat((totalWeightInGrams + packageEmptyWeight) / 1000) || 0.1;
      let consignee = this.order.shippingAddress || {};
      let todayDate = moment().format("YYYY-MM-DD HH:mm:ss");
      todayDate = todayDate.toString();
      let consigneeName = consignee?.name || consignee?.first_name || "";
      let consigneeStreetLines = (consignee.address1 || "") + "," + (consignee.address2 || "");
      let consigneeCity = consignee.city || "";
      let consigneeState = consignee.state || "";
      let consigneeCountry = consignee.country || "";
      let consigneePhoneNumber = consignee.phone || organization.phoneNumber;
      let consigneePin = parseInt(consignee.zip);
      let orderNumber = this.order.name || "";
      let consigntGSTAmount = this.order.totalPrice || 0;
      // let orderpackageList = this.order.packageDimensions || [];
      let noOfPieces = 1;
      let packageHeight = packageDimensions.height || 0;
      let packageLength = packageDimensions.length || 0;
      let packageWidth = packageDimensions.width || 0;
      // const SHIPPING_MODE = "Surface";
      let shippingMode = this.getShippingMode(this.order) || "";
      const PAYMENT_MODE = this.order?.courierDetails?.paymentMode || "Pre-paid";
      const ADDRESS_TYPE = "office";
      let data = {
        shipments: [
          {
            name: consigneeName,
            add: consigneeStreetLines,
            address_type: ADDRESS_TYPE,
            city: consigneeCity,
            state: consigneeState,
            country: consigneeCountry,
            pin: consigneePin,
            phone: consigneePhoneNumber,
            payment_mode: PAYMENT_MODE,
            order: orderNumber,
            shipping_mode: shippingMode,
            weight: totalWeight,
            cod_amount: PAYMENT_MODE === "COD" ? consigntGSTAmount : 0,
            document_date: todayDate,
            waybill: this.wayBillNumber,
            order_date: todayDate,
            total_amount: consigntGSTAmount,
            shipment_height: packageHeight,
            shipment_width: packageWidth,
            shipment_length: packageLength,
            quantity: noOfPieces,
          },
        ],
        pickup_location: {
          name: this.pickupName,
        },
      };

      let jsonData = JSON.stringify(data);

      let queryString = `format=json&data=${jsonData}`;
      let manifestUrl = `${this.rootURL}/api/cmu/create.json`;
      let config = {
        method: "post",
        url: manifestUrl,
        headers: {
          Authorization: `Token ${this.accessToken}`,
          "Content-Type": "text/plain",
        },
        data: queryString,
      };

      let response = await axios
        .request(config)
        .then(async (response) => {
          const packageInfo = response.data?.packages[0] || null;
          if (!response.data?.success || !packageInfo) {
            return {
              isFailed: true,
              errorMessage: packageInfo?.remarks || response.data.rmk,
              ...response.data,
            };
          }
          return response.data;
        })
        .catch((error) => {
          throw new CustomError(500, error.message || error);
        });
      if (response.isFailed) {
        throw new CustomError(500, response.errorMessage || "Failed to create shipment");
      }
      return { order: this.order, shipmentResponse: response };
    } catch (err) {
      console.log(err);
      throw new CustomError(500, err);
    }
  }
  getShippingMode(order) {
    let serviceType = this.order?.shippingService?.serviceType || "";
    let shippingModes = this.order?.shippingService?._id?.courierId?.shippingModes || [];
    for (const mode of shippingModes) {
      if (mode._id.toString() === serviceType.toString()) {
        // Ensure toString comparison
        return mode.mode;
      }
    }
    throw new CustomError(400, "Shipping mode not found");
  }
}

module.exports = DelhiveryCourier;

/*
//Manifestation API response  for COD orders
{
    "cash_pickups_count": 0.0,
    "package_count": 1,
    "upload_wbn": "UPL11849858992080244638",
    "replacement_count": 0,
    "pickups_count": 0,
    "packages": [
        {
            "status": "Success",
            "client": "FouviSURFACE-B2C",
            "sort_code": null,
            "remarks": [
                ""
            ],
            "waybill": "6625910021722",
            "cod_amount": 1293.89,
            "payment": "COD",
            "serviceable": false,
            "refnum": "3"
        }
    ],
    "cash_pickups": 0.0,
    "cod_count": 1,
    "success": true,
    "prepaid_count": 0,
    "cod_amount": 1293.89
}


//response for prepaid orders

{
    "cash_pickups_count": 0.0,
    "package_count": 1,
    "upload_wbn": "UPL10128084948999292808",
    "replacement_count": 0,
    "pickups_count": 0,
    "packages": [
        {
            "status": "Success",
            "client": "FouviSURFACE-B2C",
            "sort_code": null,
            "remarks": [
                ""
            ],
            "waybill": "6625910021733",
            "cod_amount": 0.0,
            "payment": "Pre-paid",
            "serviceable": false,
            "refnum": "3"
        }
    ],
    "cash_pickups": 0.0,
    "cod_count": 0,
    "success": true,
    "prepaid_count": 1,
    "cod_amount": 0.0
}

*/
