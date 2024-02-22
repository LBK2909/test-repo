const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { getNextDocumentId } = require("../utils/db.js");

const tenantSchema = new Schema(
  {
    _id: Number,
    name: { type: String, required: true },
    userId: { type: Number, required: true },
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
    //   customFields: Schema.Types.Mixed, // Flexible field for tenant-specific data
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

tenantSchema.pre("save", async function (next) {
  const tenant = this;
  if (tenant.isNew) {
    const session = this.$session();
    if (session) console.log("session alive in tenant pre hook!!!");
    let id = await getNextDocumentId("tenantId", session);
    tenant._id = id;
  }
  next();
});

tenantSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};
const Tenant = mongoose.model("Tenant", tenantSchema);

module.exports = Tenant;
