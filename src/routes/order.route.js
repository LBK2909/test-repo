const express = require("express");
const { shopifyController } = require("../controllers/salesChannels");
const { orderController } = require("../controllers");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");
const { organizationValidation, validate } = require("../validations/index");
const router = express.Router();

const { chainMiddleware } = require("../utils/util");
const verifyAuthOnly = chainMiddleware([auth.verifyToken]);
const verifyAccess = chainMiddleware([auth.verifyToken, auth.verifyUserOrganization]);
// Middleware to conditionally apply verifyAccess
const conditionalVerifyAccess = (req, res, next) => {
  // List of paths that don't require the verifyAccess middleware
  const pathsWithoutAccessCheck = ["/setup"];
  if (pathsWithoutAccessCheck.includes(req.path)) {
    verifyAuthOnly(req, res, next);
  } else {
    verifyAccess(req, res, next); // Apply the verifyAccess middleware
  }
};
// Apply this conditional middleware globally if all routes go through one entry point
router.use(conditionalVerifyAccess);
router.get("/sync-shopify-orders/:shopId", shopifyController.syncOrders);
router.get("/get-orders", orderController.orders);
router.put("/update-order", orderController.updateOrder);

module.exports = router;
