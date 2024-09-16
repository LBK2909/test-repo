const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    orgId: {
      type: Number,
      ref: "Organization", // Reference to the Users collection
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan", // Reference to the Plans collection
      required: true,
    },
    startDate: {
      type: Date, // Start date of the subscription
      required: true,
    },
    endDate: {
      type: Date, // End date or next billing date of the subscription
      required: true,
    },
    billingCycle: {
      type: String, // "monthly", "annual", etc.
      enum: ["monthly", "annual"],
      required: true,
    },
    status: {
      type: String, // Status of the subscription
      enum: ["active", "canceled", "expired"],
      default: "active",
    },
    autoRenew: {
      type: Boolean, // Indicates if the subscription will auto-renew
      default: false,
    },
    orderCount: {
      type: Number, // Number of orders remaining for the current cycle
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
