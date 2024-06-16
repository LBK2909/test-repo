//model schema for product id, name, and quantity and default weight
const mongoose = require("mongoose");

const Box = mongoose.model(
  "Box",
  new mongoose.Schema(
    {
      orgId: { type: Number, ref: "Organization", required: true },
      name: String,
      width: {
        type: Number,
        default: 0,
      },
      height: {
        type: Number,
        default: 0,
      },
      length: {
        type: Number,
        default: 0,
      },
      emptyWeight: {
        type: Number,
        default: 0,
      },
    },
    { timestamps: true }
  )
);
module.exports = Box;
