const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const endpointSchema = new Schema({
  rootUrl: { type: String, required: true },
  authType: { type: String, required: true },
  apiKey: { type: String, required: true },
});

const shippingModeSchema = new Schema({
  mode: { type: String, required: true },
  description: { type: String },
  deliveryTime: { type: String }, // e.g., "1-2 business days"
  cost: { type: Number }, // Optional: cost of the shipping mode
});

const courierSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    imageUrl: { type: String },
    description: { type: String },
    serviceAreas: [{ type: String }],
    credentials: [{ type: String }], // Array of credential keys required by the courier
    endpoints: {
      testing: endpointSchema,
      production: endpointSchema,
    },
    shippingModes: [shippingModeSchema], // Array of shipping modes
    // defaultShippingMode: shippingModeSchema,
    supportContact: {
      email: { type: String },
      phone: { type: String },
    },
    trackingUrl: { type: String }, // Base URL for tracking shipments
    documentationUrl: { type: String }, // URL for API documentation
    isActive: { type: Boolean, default: true }, // Status of the courier
  },
  { timestamps: true }
);

const Courier = mongoose.model("Courier", courierSchema);
module.exports = Courier;
