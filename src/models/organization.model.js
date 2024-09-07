const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { getNextDocumentId } = require("../utils/db.js");
const validator = require("validator");
const { union } = require("lodash");

const addressSchema = new Schema(
  {
    apartment: String,
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    phoneNumber: Number,
  },
  { _id: false }
);

const organizationSchema = new Schema(
  {
    _id: Number,
    organizationName: { type: String, required: true },
    displayName: { type: String, required: false },
    userId: { type: Number, default: null },
    configurationSetup: { type: Boolean, default: false },
    billingAddress: addressSchema,
    currency: { type: String, default: null },
    companyLogo: { type: String, default: null },
    website: {
      type: String,
      required: false,
    },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
  { _id: false }
);

organizationSchema.pre("save", async function (next) {
  const organization = this;
  if (organization.isNew) {
    let id = await getNextDocumentId("organizationId");
    organization._id = id;
  }
  next();
});

organizationSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};
const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
