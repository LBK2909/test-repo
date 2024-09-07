const mongoose = require("mongoose");

const stripeOrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Payment Intent ID
  amount: { type: Number, required: true }, // Payment Amount
  currency: { type: String, required: true }, // Currency used
  status: { type: String, required: true }, // Status (e.g., succeeded, failed, processing)
  client_secret: { type: String, required: true }, // Client secret for frontend use
  createdAt: { type: Date, default: Date.now }, // Creation time of the payment intent
  livemode: { type: Boolean, required: true }, // Live or test mode
  receipt_email: { type: String }, // Email for sending the receipt
  description: { type: String }, // Optional description (e.g., for the plan or order)
});

const stripeOrder = mongoose.model("stripeOrder", stripeOrderSchema);

module.exports = stripeOrder;
