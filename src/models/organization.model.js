const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { getNextDocumentId } = require("../utils/db.js");
const validator = require("validator");
const { union } = require("lodash");

const addressSchema = new Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  { _id: false }
);

const organizationSchema = new Schema(
  {
    _id: Number,
    organizationName: { type: String, required: true, unique: true },
    displayName: { type: String, required: false },
    phoneNumber: { type: Number, required: true },
    userId: { type: Number, default: null },
    configurationSetup: { type: Boolean, default: false },
    billingAddress: addressSchema,
    companyLogo: { type: String, default: null },
    // contactInformation: {
    //   email: { type: String, required: true },
    //   phone: String,
    //   address: {
    //     street: String,
    //     city: String,
    //     state: String,
    //     zip: String,
    //     country: String,
    //   },
    // },
    //   organizationType: { type: String, required: true, enum: ["corporation", "partnership", "sole proprietorship"] },
    // company: {
    //   name: {
    //     type: String,
    //     required: true,
    //   },
    //   website: String,
    //   industry: String,
    //   size: String,
    //   description: String,
    //   logo: String,
    // },
    //   shippingPreferences: {
    //     preferredCarriers: [String],
    //     shippingMethods: [String],
    //     packagingPreferences: [String],
    //   },
    //   billingInformation: {
    //     billingAddress: {
    //       street: String,
    //       city: String,
    //       state: String,
    //       zip: String,
    //       country: String,
    //     },
    //     paymentMethod: String,
    //     paymentTerms: String,
    //   },
    //   accessControlList: [
    //     {
    //       userId: Schema.Types.ObjectId,
    //       permissions: [String],
    //     },
    //   ],
    //   integrationSettings: {
    //     inventorySystem: {
    //       apiKey: String,
    //       endpoint: String,
    //     },
    //     ecommercePlatform: {
    //       apiKey: String,
    //       endpoint: String,
    //     },
    //     accountingSoftware: {
    //       apiKey: String,
    //       endpoint: String,
    //     },
    //   },
    //   customFields: Schema.Types.Mixed, // Flexible field for organization-specific data
    //   status: { type: String, required: true, enum: ["active", "inactive", "pending"] },
    //   createdAt: { type: Date, default: Date.now },
    //   updatedAt: { type: Date, default: Date.now },
    //   securitySettings: {
    //     twoFactorAuthentication: Boolean,
    //     passwordPolicy: String,
    //     sessionTimeout: Number,
    //   },
    //   subscriptionDetails: {
    //     planType: String,
    //     renewalDate: Date,
    //     featureAccess: [String],
    //   },
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
