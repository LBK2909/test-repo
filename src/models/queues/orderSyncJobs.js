const mongoose = require("mongoose");
const { ref } = require("pdfkit");

const OrderSyncJobSchema = new mongoose.Schema({
  jobId: String,
  status: { type: String, default: "pending" }, // 'pending', 'in-progress', 'completed', 'failed'
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  orgId: { type: Number, ref: "Organization", required: true },
  progress: { type: Number, default: 0 },
  result: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OrderSyncJob", OrderSyncJobSchema);
