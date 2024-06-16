const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const shippingModeSchema = new Schema({
  mode: { type: String, required: true },
  description: { type: String },
  deliveryTime: { type: String },
  cost: { type: Number },
  isDefault: { type: Boolean, default: false }, // Indicates if this is the default shipping mode
});
const organizationCourierSchema = new Schema(
  {
    organizationId: { type: Number, ref: "Organization", required: true },
    courierId: { type: Schema.Types.ObjectId, ref: "Courier", required: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    credentials: { type: Object }, // Stores actual key-value pairs of credentials
    isProductionEnvironment: { type: Boolean, default: false },
    selectedShippingModes: [{ type: Schema.Types.ObjectId, ref: "Courier.shippingModes" }], // Array of ObjectIds referencing Courier's shippingModes
  },
  { timestamps: true }
);

const OrganizationCourier = mongoose.model("OrganizationCourier", organizationCourierSchema);
module.exports = OrganizationCourier;
