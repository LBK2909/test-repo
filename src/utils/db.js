let Counter = require("../models/counter.model");

const getNextDocumentId = async (sequenceName, session = null) => {
  const counterDocument = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { count: 1 } },
    { new: true, upsert: true, session: session }
  );
  console.log({ counterDocument });

  return counterDocument.count || 1;
};

module.exports = {
  getNextDocumentId,
};
