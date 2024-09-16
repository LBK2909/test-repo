const mongoose = require("mongoose");
const { getNextDocumentId } = require(__basedir + "/utils/db.js");

const invoiceSchema = new mongoose.Schema(
  {
    _id: Number,
    orgId: {
      type: Number,
      ref: "Organization", // Reference to the Users collection
      required: true,
    },
    transactionId: {
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
    issuedAt: {
      type: Date, // Date when the invoice was issued
      default: Date.now,
    },
    status: {
      type: String, // Status of the invoice (e.g., 'paid', 'unpaid', 'overdue')
      enum: ["paid", "unpaid", "overdue"],
      default: "unpaid",
    },
    pdfURL: {
      type: String, // URL to the PDF version of the invoice
    },
    createdAt: {
      type: Date, // Timestamp when the billing record was created
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

// Pre-save hook to generate sequential invoice numbers starting from 1001
invoiceSchema.pre("save", async function (next) {
  const invoice = this;

  if (invoice.isNew) {
    try {
      // Use the counter to get the next invoice number
      const nextInvoiceNumber = await getNextDocumentId("invoiceId");
      invoice._id = nextInvoiceNumber;
    } catch (error) {
      return next(error);
    }
  }

  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;
