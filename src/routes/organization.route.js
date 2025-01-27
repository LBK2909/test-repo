const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization.controller");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");
const { organizationValidation, validate } = require("../validations/index");
const { chainMiddleware } = require("../utils/util");
const verifyAuthOnly = chainMiddleware([auth.verifyToken]);
const verifyAccess = chainMiddleware([auth.verifyToken, auth.verifyUserOrganization]);
const upload = require("../config/fileHandlerConfig"); // Adjust the path as needed

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
router.get("/organizations", organizationController.organizations);
router.post(
  "/connect-to-organization",
  organizationValidation.connectToOrganization(),
  validate,
  auth.verifyToken,
  organizationController.connectToOrganization
);
router.get("/getOrganization", organizationController.getOrganization);
router.get("/get-organization-members", organizationController.getOrganizationMembers);
router.put("/update-organization", organizationController.updateOrganization);
router.get("/get-installed-shops/:organizationId", auth.verifyToken, organizationController.getInstalledShops);
router.post("/setup/select-organization", organizationController.selectOrganization);
router.post("/add-new-organization", organizationController.addNewOrganization);
router.get("/default-organization/:orgId", organizationController.defaultOrganization);
// route get for get-organization-invoices
router.get("/get-organization-invoices", organizationController.getOrganizationInvoices);
///v1/organization/get-organization-subscription
router.get("/get-organization-subscription", organizationController.getOrganizationSubscription);
// router.put("/update-organization-courier/:id", organizationController.updateOrganizationCourier);
// router.post("/select-organization", (req, res) => {
//   const { organizationId } = req.body;
//   // Set a secure, HttpOnly cookie with the organization ID
//   res.cookie("organization_id", organizationId, { httpOnly: true, secure: true, sameSite: "Strict", path: "/" });
//   res.send({ message: "Organization selected successfully." });
// });

router.get("/test-org", (req, res) => {
  console.log("test-method updated...");
  res.send("test method updated...");
});
router.post(
  "/connect-courier-to-organization",
  // organizationValidation.connectCourierToOrganization(),
  // validate,
  organizationController.connectCourierToOrganization
);

function userHasAccessToOrganization(userId, organizationId) {
  // Dummy check for example purposes
  return userId && organizationId && userId.startsWith("user") && organizationId === "123";
}

module.exports = router;
