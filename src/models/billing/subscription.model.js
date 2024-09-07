const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the Users collection
      required: true,
    },
    plan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan", // Reference to the Plans collection
      required: true,
    },
    start_date: {
      type: Date, // Start date of the subscription
      required: true,
    },
    end_date: {
      type: Date, // End date or next billing date of the subscription
      required: true,
    },
    billing_cycle: {
      type: String, // "monthly", "annual", etc.
      enum: ["monthly", "annual"],
      required: true,
    },
    status: {
      type: String, // Status of the subscription
      enum: ["active", "canceled", "expired"],
      default: "active",
    },
    auto_renew: {
      type: Boolean, // Indicates if the subscription will auto-renew
      default: true,
    },
    order_count: {
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
