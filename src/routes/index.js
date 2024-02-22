const express = require("express");
const devRoute = require("./dev.route");
const config = require("../config/config");
const shippingRoute = require("./shipping.route");
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
