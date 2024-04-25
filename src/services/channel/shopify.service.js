const { Shop } = require("../../models/shop.model");
const bcrypt = require("bcryptjs");
let axios = require("axios");
const CustomError = require("../../utils/customError");
const httpStatus = require("http-status");
let { ShopifyShop } = require("../../models/shop.model");
async function authenticateShop(shop) {
  const existingShop = await Shop.findOne({ name: shop });
  if (existingShop) {
    if (existingShop.organizationId) {
      return { url: `${process.env.CLIENT_BASE_URL}/organizations` };
    } else {
      return { url: `${process.env.CLIENT_BASE_URL}/channel-management?shop=${shop}&install=true&channel=shopify` };
    }
  }
  let salt = null;
  try {
    // Generate a salt
    salt = await bcrypt.genSalt(10);
    nonce = salt;
    // You can use the salt with bcrypt.hash() to hash a password
  } catch (err) {
    console.error("Error generating salt:", err);
    throw err;
  }
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri = `${process.env.SERVER_BASE_URL}/auth/shopify/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=read_products&state=${salt}&redirect_uri=${redirectUri}`;

  return { url: installUrl };
}

async function installShopifyApp(shop, code) {
  const tokenUrl = `https://${shop}/admin/oauth/access_token`;

  try {
    const response = await axios.post(tokenUrl, {
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    });

    console.log(response.data);
    const ACCESS_TOKEN = response.data.access_token || null;
    // Get shop owner details from Shopify API
    const shopOwnerUrl = `https://${shop}/admin/api/2024-04/shop.json`;
    const shopResponse = await axios.get(shopOwnerUrl, {
      headers: {
        "X-Shopify-Access-Token": ACCESS_TOKEN,
      },
    });
    console.log(shopResponse.data);
    // Check if shop already exists
    const existingShop = await Shop.findOne({ name: shop });
    if (existingShop) {
      console.error("Shop already exists");
      // throw error here
      throw new CustomError(httpStatus.BAD_REQUEST, "Shop already exists");
    } else {
      const newShop = new ShopifyShop({
        name: shopResponse?.data?.shop?.domain,
        email: shopResponse?.data?.shop?.email,
        storeUrl: shopResponse?.data?.shop?.domain,
        accessToken: ACCESS_TOKEN,
      });
      await newShop.save();
      console.log("Shop and Organization created successfully");
    }
    const redirectURI = `http://localhost:5173/organizations?shop=${shop}&email=${shopResponse.data.shop.email}&install=true&channel=shopify`;
    return { url: redirectURI };
  } catch (error) {
    throw new CustomError(httpStatus.INTERNAL_SERVER_ERROR, "Error getting access token");
  }
}
module.exports = {
  authenticateShop,
  installShopifyApp,
};
