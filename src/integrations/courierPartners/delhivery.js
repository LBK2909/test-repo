let axios = require("axios");
const CustomError = require("../../utils/customError");

class DelhiveryCourier {
  constructor(accessToken, URL) {
    this.accessToken = accessToken;
    this.rootURL = URL;
    // Initialize any other configurations or dependencies here
  }

  async initiateBooking() {
    try {
      // Logic to initiate booking using this.accessToken and this.URL
      console.log("Initiating booking with Delhivery...");
      let wayBillNumber = await this.generateWaybill();
      let createShipment = await this.createShipment();
      console.log({ wayBillNumber });
    } catch (err) {
      console.log("error in initiatebooking....");
      console.log(err);
      throw new CustomError(500, err);
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
          console.log("error", error);
          throw error;
        });
      console.log({ wayBillResponse });
      return wayBillResponse;
    } catch (error) {
      console.log(error);
      throw new CustomError(500, err);
    }
  }
  async createShipment() {
    try {
      return true;
    } catch (err) {
      console.log(err);
      throw new CustomError(500, err);
    }
  }
}

module.exports = DelhiveryCourier;
