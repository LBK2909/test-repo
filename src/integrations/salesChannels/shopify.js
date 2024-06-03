const axios = require("axios");
//import the custom error
const CustomError = require("../../utils/CustomError");
const httpStatus = require("http-status");
class Shopify {
  constructor(accessToken, storeUrl) {
    this.accessToken = accessToken;
    this.storeUrl = storeUrl;
  }

  async fetchOrders(params = {}) {
    console.log("fetch orders params ....", params);
    try {
      let { link, latestOrderId } = params;
      let API_URL = "";
      if (link && link.next) {
        API_URL = `https://${this.storeUrl}/admin/api/2024-04/orders.json?page_info=${link.next}&limit=50&fields=id,email,customer,order_number,line_items,refunds,name,note,shipping_address,shipping_lines,note,created_at,tags,total_weight,total_price,total_price_set,total_line_items_price,current_subtotal_price,payment_gateway_names`;
      } else {
        if (latestOrderId) {
          API_URL = `https://${this.storeUrl}/admin/api/2024-04/orders.json?since_id=${latestOrderId}&fulfillment_status=unfulfilled&limit=50&fields=id,email,customer,order_number,line_items,refunds,shipping_address,shipping_lines,name,note,created_at,tags,total_weight,total_price,total_price_set,total_line_items_price,current_subtotal_price,payment_gateway_names`;
        } else {
          API_URL = `https://${this.storeUrl}/admin/api/2024-04/orders.json?fulfillment_status=unfulfilled&limit=50&fields=id,email,customer,order_number,line_items,refunds,shipping_address,shipping_lines,name,note,created_at,tags,total_weight,total_price,total_price_set,total_line_items_price,current_subtotal_price,payment_gateway_names`;
        }
      }
      //   let pageInfo = req.params.pageInfo || "";
      let apiResponse = await axios
        .get(API_URL, {
          headers: {
            "X-Shopify-Access-Token": this.accessToken,
          },
        })
        .then(async function (res) {
          let payloadObj = {};
          //push orders into OrderManagement collection
          //iterate through the res
          payloadObj["orders"] = res.data.orders || [];
          payloadObj["headerLink"] = res.headers.link || "";
          return payloadObj;
        })
        .catch(function (error) {
          throw new CustomError(500, "Failed to Fetch Orders from Shopify API");
        });
      return apiResponse;
    } catch (err) {
      // throw custom error
      throw new CustomError(
        err.statusCode || httpStatus.INTERNAL_SERVER_ERROR,
        err.message || "Failed to Fetch Orders from Shopify API"
      );
    }
  }

  // Additional methods as needed for your application
}

module.exports = Shopify;
