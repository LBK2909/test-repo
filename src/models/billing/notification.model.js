const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the Users collection
    required: true,
  },
  type: {
    type: String, // Type of notification (e.g., 'payment_success', 'subscription_renewal', 'invoice_generated')
    enum: [
      "payment_success",
      "payment_failed",
      "subscription_renewal",
      "invoice_generated",
      "subscription_canceled",
      "general_alert",
    ],
    required: true,
  },
  status: {
    type: String, // Status of the notification (e.g., 'sent', 'pending', 'failed')
    enum: ["sent", "pending", "failed"],
    default: "pending",
  },
  message: {
    type: String, // The actual content of the notification message
    required: true,
  },
  sent_via: {
    type: String, // Channel through which the notification was sent (e.g., 'email', 'sms', 'push')
    enum: ["email", "sms", "push", "in-app"],
    required: true,
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the related record (e.g., transaction, subscription, invoice)
    required: false, // Optional, depending on the type of notification
  },
  sent_at: {
    type: Date, // Timestamp of when the notification was sent
    default: Date.now,
  },
  created_at: {
    type: Date, // Timestamp when the notification record was created
    default: Date.now,
  },
  updated_at: {
    type: Date, // Timestamp when the notification record was last updated
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
