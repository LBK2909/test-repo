const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courierSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    imageUrl: { type: String },
    description: { type: String },
    serviceAreas: [{ type: String }],
    credentials: [{ type: String }], // Array of credential keys required by the courier
  },
  { timestamps: true }
);

const Courier = mongoose.model("Courier", courierSchema);
module.exports = Courier;
