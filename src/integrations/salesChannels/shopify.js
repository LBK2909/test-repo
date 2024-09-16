const axios = require("axios");
//import the custom error
const CustomError = require("../../utils/customError");
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
        API_URL = `https://${this.storeUrl}/admin/api/2024-04/orders.json?page_info=${link.next}&limit=250&fields=id,email,customer,order_number,line_items,refunds,name,note,shipping_address,shipping_lines,note,created_at,tags,total_weight,total_price,total_price_set,total_line_items_price,current_subtotal_price,payment_gateway_names`;
      } else {
        if (latestOrderId) {
          API_URL = `https://${this.storeUrl}/admin/api/2024-04/orders.json?since_id=${latestOrderId}&fulfillment_status=unfulfilled&limit=250&fields=id,email,customer,order_number,line_items,refunds,shipping_address,shipping_lines,name,note,created_at,tags,total_weight,total_price,total_price_set,total_line_items_price,current_subtotal_price,payment_gateway_names`;
        } else {
          API_URL = `https://${this.storeUrl}/admin/api/2024-04/orders.json?fulfillment_status=unfulfilled&limit=250&fields=id,email,customer,order_number,line_items,refunds,shipping_address,shipping_lines,name,note,created_at,tags,total_weight,total_price,total_price_set,total_line_items_price,current_subtotal_price,payment_gateway_names&order=created_at asc`;
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
          console.log("error in fetching orders from shopify", error);
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

  async fetchFulfillmentIdFromShopify(orders) {
    const chunkSize = 15;
    const interval = 5000; // 5 seconds delay between chunks
    const results = [];

    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);

      // Create an array of promises for API calls
      const chunkPromises = chunk.map((order) => this.fetchFulfillmentId(order));

      try {
        // Wait for all promises in the current chunk to resolve
        const chunkResults = await Promise.allSettled(chunkPromises);

        // Append fulfillment results to the corresponding order objects
        chunkResults.forEach((result, index) => {
          // let obj = JSON.parse(JSON.stringify(result));
          if (result.status === "fulfilled") {
            let object = chunk[index];
            if (object.fulfillmentId === undefined) {
              object.fulfillmentId = "";
            }
            object.fulfillmentId = result.value.id;

            chunk[index] = object;
          } else {
            console.error(`Error fetching fulfillment for order ${chunk[index].orderId}:`);
          }
        });
        results.push(...chunk);
      } catch (error) {
        console.error("Error while fetching chunk of orders in fetchFulfillmentIdFromShopify:");
        console.log(error);
      }

      if (i + chunkSize < orders.length) {
        await this.delay(interval);
      }
    }

    return results;
  }

  async fetchFulfillmentId(order) {
    try {
      let shopifyOrderId = order.orderId;
      let shopUrl = order?.shop?.storeUrl;
      let accessToken = order?.shop?.accessToken;

      let API_URL = `https://${shopUrl}/admin/api/2024-04/orders/${shopifyOrderId}/fulfillment_orders.json`;
      const response = await axios.get(API_URL, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
        },
      });

      const res = response.data;

      if (res.fulfillment_orders?.length > 0) {
        return res.fulfillment_orders[res.fulfillment_orders.length - 1];
      }
      return {};
    } catch (error) {
      console.error(`Error while fetching order ID ${order.orderId}:`, error);
      return {};
    }
  }

  async orderFulfillmentShopifyAPI(orders) {
    const delayBetweenOrders = 5000;
    const maxRetries = 3;

    const fulfillOrderWithRetry = async (order, retryCount) => {
      try {
        const { fulfillmentId = "", courierDetails = "", shop = "" } = order;
        console.log({ fulfillmentId });
        // return { fulfillmentId, courierDetails, shop };

        let shopUrl = order?.shop?.storeUrl;
        let accessToken = order?.shop?.accessToken;
        // let courier=order.shop?.courier;
        let API_URL = `https://${shopUrl}/admin/api/2024-04/fulfillments.json`;

        const response = await axios.post(
          API_URL,
          {
            fulfillment: {
              line_items_by_fulfillment_order: [{ fulfillment_order_id: fulfillmentId }],
              tracking_info: {
                company: "delhivery",
                number: courierDetails.trackingNumber,
                url: courierDetails.trackingURL || "",
              },
              notify_customer: true,
            },
          },
          {
            headers: {
              "X-Shopify-Access-Token": accessToken,
            },
          }
        );
        let fulfillmentData = response.data?.fulfillment || {};
        return { order, fulfillment: fulfillmentData };
      } catch (error) {
        console.error(`Error while fulfilling order ID ${order.shopifyOrderId}:`, error.response?.data);
        if (retryCount < maxRetries) {
          console.log(`Retrying fulfillment for order ID ${order.shopifyOrderId} after ${delayBetweenOrders / 1000} seconds...`);
          await this.delay(delayBetweenOrders);
          return fulfillOrderWithRetry(order, retryCount + 1);
        } else {
          return { order, error };
        }
      }
    };

    const promises = orders.map((order) => fulfillOrderWithRetry(order, 0));

    try {
      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error("Error while fulfilling multiple orders:", error);
      throw error;
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Additional methods as needed for your application

module.exports = Shopify;
