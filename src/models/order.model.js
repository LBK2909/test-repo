const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    grams: {
      type: Number,
      required: false,
      default: 0,
    },
    sku: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
  orgId: { type: Number, required: true },
  name: {
    type: String,
    required: false,
  },
  customer: {
    type: Object,
    required: false,
  },
  orderNumber: {
    type: String,
    required: false,
  },
  orderId: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "processing", "labeled", "shipped", "delivered", "cancelled", "failed"],
    default: "pending",
  },

  totalPrice: {
    type: Number,
    required: true,
  },
  lineItems: [lineItemSchema],
  // lineItems: {
  //   type: Array,
  //   required: false,
  // },
  shippingAddress: {
    type: Object,
    required: false,
    default: null,
  },

  paymentStatus: {
    type: String,
    required: true,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  financialStatus: {
    type: String,
    required: false,
    default: null,
  },
  // paymentGateway: {
  //   type: String,
  //   required: false,
  //   default: null,
  // },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
