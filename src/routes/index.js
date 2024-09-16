const express = require("express");
const devRoute = require("./common.route");
const config = require("../config/config");
const shippingRoute = require("./shipping.route");
const organizationRoute = require("./organization.route");
const orderRoute = require("./order.route");
const userRoute = require("./user.route");
const courierRoute = require("./courier.route");
const configRoute = require("./config.route");
const billingRoute = require("./billing/index.route");
const razorPayRoute = require("./billing/razorpay.route");
const stripeRoute = require("./billing/stripe.route");
const salesChannelRoute = require("./salesChannel.route");
const router = express.Router();

const defaultRoutes = [
  {
    path: "/",
    route: devRoute,
  },
  {
    path: "/shipping",
    route: shippingRoute,
  },
  {
    path: "/organization",
    route: organizationRoute,
  },
  {
    path: "/orders",
    route: orderRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/couriers",
    route: courierRoute,
  },
  {
    path: "/config",
    route: configRoute,
  },
  {
    path: "/billing",
    route: billingRoute,
  },
  {
    path: "/billing/razorpay",
    route: razorPayRoute,
  },
  {
    path: "/billing/stripe",
    route: stripeRoute,
  },
  {
    path: "/sales-channel",
    route: salesChannelRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

// /* istanbul ignore next */
// if (config.env === "development") {
//   devRoutes.forEach((route) => {
//     router.use(route.path, route.route);
//   });
// }

module.exports = router;
