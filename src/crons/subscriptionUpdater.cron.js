const cron = require("node-cron");
const moment = require("moment");
const { Subscription, Organization } = require(__basedir + "/models");
//

// Cron job to run every day at midnight
function subscriptionUpdater() {
  cron.schedule("0 0 * * *", async () => {
    try {
      const currentDate = moment().toISOString();
      const expiredSubscriptions = await Subscription.find({
        status: "active",
        endDate: { $lt: currentDate },
      });
      for (const subscription of expiredSubscriptions) {
        subscription.status = "expired";
        await subscription.save();
        await updateOrganization(subscription.orgId);
      }

      console.log("Subscription status update job completed.");
    } catch (err) {
      console.error("Error during subscription status update job:", err);
    }
  });
}

async function updateOrganization(orgId) {
  let organization = await Organization.findOneAndUpdate({ _id: orgId }, { $set: { orderCount: 50 } });
  // Logic to update the organization with the expired subscription
}

module.exports = subscriptionUpdater;
