const mongoose = require("mongoose");
const config = require("config");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoose.url, config.mongoose.options);
    // const conn = await mongoose.connect(
    //   "mongodb+srv://Cobay:1ne%402024@cobay-staging.v4jl3gz.mongodb.net/staging?retryWrites=true&w=majority",
    //   {
    //     useNewUrlParser: true,
    //     useUnifiedTopology: true,
    //   }
    // );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
