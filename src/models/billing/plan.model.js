const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    order_count: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      enum: ["USD", "INR"],
    },
    billing_cycle: {
      type: String,
      enum: ["monthly", "annual"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 30, // Duration in days
    },
    features: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PlanSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Plan", PlanSchema);
