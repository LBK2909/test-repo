const express = require("express");
const devRoute = require("./common.route");
const config = require("../config/config");
const shippingRoute = require("./shipping.route");
const organizationRoute = require("./organization.route");
const orderRoute = require("./order.route");
const userRoute = require("./user.route");
const courierRoute = require("./courier.route");
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
