const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  orgId: {
    type: Number,
    ref: "Organization", // Reference to the Users collection
    required: true,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription", // Reference to the Subscriptions collection
    required: false, // Not required if the transaction is not linked to a subscription
  },
  price: {
    type: mongoose.Types.Decimal128, // The monetary value of the transaction
    required: true,
  },
  currency: {
    type: String, // The currency of the transaction (e.g., 'USD', 'INR')
    required: true,
  },
  type: {
    type: String, // Type of transaction (e.g., 'payment', 'refund', 'credit')
    enum: ["payment", "refund", "credit"],
    required: true,
  },
  status: {
    type: String, // Status of the transaction
    enum: ["completed", "pending", "failed"],
    default: "pending",
  },
  paymentId: {
    type: String, // Reference to the payment method used (e.g., from Stripe)
    required: true,
  },
  paymentGateway: {
    type: String,
    required: true,
  },
  transactionDate: {
    type: Date, // Timestamp when the transaction was processed
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
