const mongoose = require("mongoose");

// Base schema for the shop collection
const shopSchema = new mongoose.Schema(
  {
    organizationId: {
      type: Number,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    // Add other common fields here
  },
  {
    timestamps: true,
    discriminatorKey: "channelType",
  }
);

// Schema for the Shopify discriminator collection
const shopifySchema = new mongoose.Schema({
  // apiKey: { type: String, required: true },
  accessToken: { type: String, required: true },
  storeUrl: { type: String, required: true },
});

// Create the base model
const Shop = mongoose.model("Shop", shopSchema);

// Create the Shopify model as a discriminator of the base model
const ShopifyShop = Shop.discriminator("Shopify", shopifySchema);

module.exports = {
  Shop,
  ShopifyShop,
};
