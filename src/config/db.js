const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // const conn = await mongoose.connect("mongodb://0.0.0.0:27017/cobay-shipping", {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    // });
    const conn = await mongoose.connect(
      "mongodb+srv://harish:EngAtFov@cobaytesting.nmbu6j1.mongodb.net/cobay-testing?retryWrites=true&w=majority",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
