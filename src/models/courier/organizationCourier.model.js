const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const organizationCourierSchema = new Schema(
  {
    organizationId: { type: Number, ref: "Organization", required: true },
    courierId: { type: Schema.Types.ObjectId, ref: "Courier", required: true },
    isActive: { type: Boolean, default: true },
    credentials: { type: Map, of: String }, // Stores actual key-value pairs of credentials
  },
  { timestamps: true }
);

const OrganizationCourier = mongoose.model("OrganizationCourier", organizationCourierSchema);
module.exports = OrganizationCourier;
