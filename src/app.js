require("dotenv").config();
const express = require("express");
global.__basedir = __dirname;
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const routes = require("./routes");
const authRoutes = require("./routes/auth.route"); // Import auth routes
const shopifyWebhookRoutes = require("./routes/shopify.webhooks.route");
const connectDB = require("./config/db");
const colors = require("colors");
const CustomError = require("./utils/customError");
const { errorHandler, errorConverter } = require("./middlewares/error.middleware");
var session = require("express-session");
var passport = require("passport");
require("./config/winston_logger");
require("./config/logger");
const { startCrons } = require(__basedir + "/crons/index");
const app = express();
connectDB();
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [process.env.CLIENT_BASE_URL];
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

app.use((req, res, next) => {
  console.log(req.originalUrl);
  if (req.originalUrl.includes("/billing/stripe/webhooks")) {
    // Skip JSON body parsing for routes that contain '/webhooks'
    next();
  } else {
    // Apply JSON body parsing for all other routes
    bodyParser.json({ limit: "10mb" })(req, res, next);
  }
});

app.use((req, res, next) => {
  if (req.originalUrl.includes("/billing/stripe/webhooks")) {
    // Skip URL-encoded body parsing for Stripe webhook route
    next();
  } else {
    // Apply URL-encoded body parsing for all other routes
    bodyParser.urlencoded({ limit: "10mb", extended: true })(req, res, next);
  }
});
app.use(cookieParser());
// app.use(cors(corsOptions));
app.use(morgan("dev"));
// v1 api routes
app.use("/v1", routes);
app.use("/auth", authRoutes);
app.use("/webhooks", shopifyWebhookRoutes);
// Basic Route
app.get("/", (req, res) => {
  res.sendStatus(204);
});
app.get("/error", (req, res, next) => {
  throw new CustomError(404, "This is a custom error message");
});
// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

setTimeout(() => {
  startCrons();
}, 10000);
module.exports = app;
