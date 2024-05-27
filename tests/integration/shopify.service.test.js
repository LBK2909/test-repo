jest.mock("../../src/models/shop.model.js", () => ({
  ShopifyShop: {
    findOne: jest.fn(),
    discriminator: jest.fn().mockImplementation((name, schema) => ({ name, schema })), // If needed
  },
}));
jest.mock("../../src/models", () => ({
  Order: {
    findOne: jest.fn().mockReturnThis(), // Mock findOne to return 'this' for chaining
    sort: jest.fn().mockReturnThis(), // Mock sort to return 'this' for chaining
    exec: jest.fn(), // Mock exec to eventually resolve the chain
    insertMany: jest.fn(), // Mock insertMany normally
  },
}));

// Assuming these are the paths to your modules
jest.mock("../../src/models/Order.model.js");

jest.mock("../../src/integrations/salesChannels/shopify.js", () => {
  return jest.fn().mockImplementation(() => ({
    fetchOrders: jest
      .fn()
      .mockResolvedValueOnce({
        orders: [
          {
            id: "order1",
            name: "Test Order 21",
            order_number: "2001",
            total_price: "100",
            line_items: [],
            shipping_address: {},
            billing_address: {},
            created_at: new Date(),
            updated_at: new Date(),
            financial_status: "paid",
          },
        ],
        headerLink: '<https://api.shop.com/orders?page_info=nextPage>; rel="next"',
      })
      .mockResolvedValueOnce({
        orders: [
          {
            id: "order2",
            name: "Test Order 2",
            order_number: "1002",
            total_price: "200",
            line_items: [],
            shipping_address: {},
            billing_address: {},
            created_at: new Date(),
            updated_at: new Date(),
            financial_status: "paid",
          },
        ],
        headerLink: null,
      }),
  }));
});

const httpStatus = require("http-status");
const { ShopifyShop } = require("../../src/models/shop.model.js");
const { Order } = require("../../src/models");
const Shopify = require("../../src/integrations/salesChannels/shopify.js"); // This should be your actual import path
const CustomError = require("../../src/utils/customError");
const { fetchOrders, parseLinkHeader } = require("../../src/services/channel/shopify.service"); // Adjust the import path

describe("Shopify Service", () => {
  it("throws an error if the shop is not found", async () => {
    try {
      await fetchOrders("nonexistentShop");
      throw new Error("fetchOrders did not throw as expected");
    } catch (error) {
      expect(error).toBeInstanceOf(CustomError);
      expect(error.statusCode).toBe(httpStatus.NOT_FOUND);
      expect(error.message).toBe("Shop not found");
    }
  });
});

// describe("fetchOrders function", () => {
//   // Setup a mock shopify client
//   let shopifyClient;
//   beforeEach(() => {
//     jest.clearAllMocks();
//     ShopifyShop.findOne.mockResolvedValue({ _id: "shop123", accessToken: "token123", storeUrl: "url123" });
//     Order.findOne.mockResolvedValue({ orderId: "order123" }).mockReturnThis();
//     Order.sort.mockReturnThis();
//     Order.exec.mockResolvedValue({ orderId: "order123" });
//     shopifyClient = new Shopify();
//     shopifyClient.fetchOrders.mockResolvedValue({
//       orders: [
//         {
//           id: "order1",
//           name: "Test Order 0.1111",
//           order_number: "0111",
//           total_price: "100",
//           line_items: [],
//           shipping_address: {},
//           billing_address: {},
//           created_at: new Date(),
//           updated_at: new Date(),
//           financial_status: "paid",
//         },
//       ],
//       headerLink: null, // Simulating no further pages
//     });
//     // Order.insertMany.mockResolvedValue([]);
//   });

//   // it("successfully fetches and updates orders when shop exists", async () => {
//   //   const result = await fetchOrders("existingShop");

//   //   console.log("result==", result);
//   //   expect(result).toBe("Orders updated successfully");
//   //   expect(Order.insertMany).toHaveBeenCalledWith(expect.any(Array));
//   // });

//   it("handles pagination correctly", async () => {
//     // Adjust the mock to simulate pagination
//     shopifyClient.fetchOrders
//       .mockResolvedValueOnce({
//         orders: [
//           {
//             id: "order1",
//             name: "Test Order 21",
//             order_number: "2001",
//             total_price: "100",
//             line_items: [],
//             shipping_address: {},
//             billing_address: {},
//             created_at: new Date(),
//             updated_at: new Date(),
//             financial_status: "paid",
//           },
//         ],
//         headerLink: '<https://api.shop.com/orders?page_info=nextPage>; rel="next"',
//       })
//       .mockResolvedValueOnce({
//         orders: [
//           {
//             id: "order2",
//             name: "Test Order 2",
//             order_number: "1002",
//             total_price: "200",
//             line_items: [],
//             shipping_address: {},
//             billing_address: {},
//             created_at: new Date(),
//             updated_at: new Date(),
//             financial_status: "paid",
//           },
//         ],
//         headerLink: null,
//       });

//     const result = await fetchOrders("existingShop");
//     console.log(await shopifyClient.fetchOrders());
//     expect(result).toBe("Orders updated successfully");
//     expect(shopifyClient.fetchOrders).toHaveBeenCalledTimes(2);
//     // expect(Order.insertMany).toHaveBeenCalledTimes(2); // Check if it was called for each page
//   });
// });
