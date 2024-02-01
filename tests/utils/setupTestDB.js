const mongoose = require("mongoose");
const config = require("../../src/config/config");

const setupTestDB = () => {
  console.log("set up test DB....".blue.bold);
  beforeAll(async () => {
    await mongoose.connection.close();
    console.log("Mongoose connection test url.....", config.mongoose.testUrl);
    // await mongoose.connect("mongodb://localhost:27017/test_oorla_inv");
    await mongoose.connect(config.mongoose.testUrl);
  });

  beforeEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};

module.exports = setupTestDB;
