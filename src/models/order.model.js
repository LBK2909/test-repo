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

const customsInfoSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    harmonizedCode: {
      type: String,
      required: true,
    },
    countryOfOrigin: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const courierDetailsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    trackingNumber: {
      type: String,
      required: false,
    },
    trackingUrl: {
      type: String,
      required: false,
    },
    estimatedDeliveryDate: {
      type: Date,
      required: false,
    },
    shippingMethod: {
      type: String,
      required: false,
    },
    shippingCost: {
      type: Number,
      required: false,
    },
    carrierCode: {
      type: String,
      required: false,
    },
    bookingStatus: {
      type: String,
      required: false,
      enum: ["pending", "booked", "in transit", "out for delivery", "delivered", "failed"],
      default: "pending",
    },
    paymentMode: {
      type: String,
      required: false,
      default: "prepaid",
    },
    bookingInfo: {
      type: String,
      required: false,
      default: null,
    },
    shippingInsurance: {
      type: Boolean,
      required: false,
      default: false,
    },
    handlingInstructions: {
      type: String,
      required: false,
    },
    packageDimensions: {
      length: { type: Number, required: false },
      width: { type: Number, required: false },
      height: { type: Number, required: false },
      emptyWeight: { type: Number, required: false },
      unit: { type: String, required: false, enum: ["cm", "in"], default: "cm" },
    },
    packageWeight: {
      value: { type: Number, required: false },
      unit: { type: String, required: false, enum: ["kg", "lb"], default: "kg" },
    },
    customsInformation: {
      type: customsInfoSchema,
      required: false,
      default: null,
    },
    shippedAt: {
      type: Date,
      required: false,
    },
    deliveredAt: {
      type: Date,
      required: false,
    },
    bookedAt: {
      type: Date,
      required: false,
    },
    trackingHistory: {
      type: [
        {
          status: String,
          location: String,
          timestamp: Date,
        },
      ],
      required: false,
      default: [],
    },
  },
  { _id: false }
);
const shippingServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "OrganizationCourier",
    required: true,
  },
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});
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
  totalWeightGrams: {
    type: Number,
    required: true,
  },
  lineItems: [lineItemSchema],
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
  // courierPartner: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "OrganizationCourier",
  //   required: false,
  // },
  shippingService: {
    type: shippingServiceSchema,
    required: false,
  },
  courierDetails: {
    type: courierDetailsSchema,
    required: false,
    default: null,
  },
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
