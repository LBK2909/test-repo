//convert the above JSON to a Mongoose schema
const mongoose = require("mongoose");
const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    description: { type: String },
    status: { type: String, enum: ["created", "processing", "completed", "failed"], required: true },
    completedAt: { type: Date },
    orders: [
      {
        orderId: { type: String, required: true },
        userId: { type: String, required: true },
        status: { type: String, required: true },
        details: {
          itemName: { type: String, required: true },
          quantity: { type: Number, required: true },
          price: { type: Number, required: true },
        },
        result: {
          confirmationNumber: { type: String },
          message: { type: String },
        },
        error: { type: String },
      },
    ],
    summary: {
      totalOrders: { type: Number, required: true },
      completedOrders: { type: Number, required: true },
      failedOrders: { type: Number, required: true },
    },
    error: { type: String },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        message: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

jobSchema.post("findOneAndUpdate", function (doc) {
  console.log("updateOne hook called....");
  //get the updated fields

  console.log(doc);
  if (doc) {
    //check if the summary.totalOrders are equal to summary.completedOrders + summary.failedOrders
    if (doc.summary) {
      let { totalOrders, completedOrders, failedOrders } = doc.summary;
      if (totalOrders === completedOrders + failedOrders) {
        //update the status of the job to completed
        this.model.updateOne({ _id: doc._id }, { $set: { status: "completed" } });
      }
    }
  }
});
module.exports = mongoose.model("Job", jobSchema);
