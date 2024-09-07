const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the Users collection
    required: true,
  },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription", // Reference to the Subscriptions collection
    required: false, // Not required if the transaction is not linked to a subscription
  },
  amount: {
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
  payment_method_id: {
    type: String, // Reference to the payment method used (e.g., from Stripe)
    required: true,
  },
  transaction_date: {
    type: Date, // Timestamp when the transaction was processed
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
