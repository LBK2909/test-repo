require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const routes = require("./routes");
const authRoutes = require("./routes/auth.route"); // Import auth routes
const connectDB = require("./config/db");
const colors = require("colors");
const CustomError = require("./utils/CustomError");
const { errorHandler, errorConverter } = require("./middlewares/error.middleware");
var session = require("express-session");
var passport = require("passport");
require("./config/winston_logger");
let { delhiveryController } = require("./controllers/shipping/couriersPartners");
let shippingController = require("./controllers/shipping.controller");
let shopifyController = require("./controllers/salesChannels/shopify.controller");
// let { delhiveryController } = require("./controller/courierPartners");
require("./config/logger");

const app = express();
connectDB();
// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = ["https://localhost:5173"];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Access-Token"], // Include your custom header here
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(cookieParser());
// app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(bodyParser.json());
// v1 api routes
app.use("/v1", routes);
app.use("/auth", authRoutes);
// Basic Route
app.get("/", (req, res) => {
  res.send("Hello World!...");
});
app.get("/error", (req, res, next) => {
  throw new CustomError(404, "This is a custom error message");
});
// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);
// app.use(
//   session({
//     secret: "keyboard cat",
//     resave: false, // don't save session if unmodified
//     saveUninitialized: false, // don't create session until something stored
//   })
// );
// app.use(passport.authenticate("session"));
// Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
setTimeout(() => {
  // delhiveryController.createShipment();
  // shippingController.shipmentBooking();
  // shopifyController.syncOrders();
}, 2000);
module.exports = app;
