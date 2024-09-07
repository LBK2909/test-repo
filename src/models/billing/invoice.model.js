const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the Users collection
    required: true,
  },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription", // Reference to the Subscriptions collection
    required: false, // Not required if billing is not tied to a subscription
  },
  transaction_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction", // Reference to the related transaction
    required: true,
  },
  amount: {
    type: mongoose.Types.Decimal128, // Total amount billed on the invoice
    required: true,
  },
  currency: {
    type: String, // The currency of the billing amount (e.g., 'USD', 'INR')
    required: true,
  },
  issued_at: {
    type: Date, // Date when the invoice was issued
    default: Date.now,
  },
  due_date: {
    type: Date, // Payment due date for the invoice
    required: true,
  },
  status: {
    type: String, // Status of the invoice (e.g., 'paid', 'unpaid', 'overdue')
    enum: ["paid", "unpaid", "overdue"],
    default: "unpaid",
  },
  items: [
    {
      description: {
        type: String, // Description of the billed item
        required: true,
      },
      quantity: {
        type: Number, // Quantity of the billed item
        required: true,
      },
      unit_price: {
        type: mongoose.Types.Decimal128, // Price per unit of the item
        required: true,
      },
      total: {
        type: mongoose.Types.Decimal128, // Total cost for the item (quantity * unit_price)
        required: true,
      },
    },
  ],
  pdf_link: {
    type: String, // URL to the PDF version of the invoice
    required: true,
  },
  created_at: {
    type: Date, // Timestamp when the billing record was created
    default: Date.now,
  },
  updated_at: {
    type: Date, // Timestamp when the billing record was last updated
    default: Date.now,
  },
});

const Billing = mongoose.model("Billing", billingSchema);

module.exports = Billing;
