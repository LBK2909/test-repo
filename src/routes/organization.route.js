const express = require("express");
const organizationController = require("../controllers/organization.controller");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");
const { organizationValidation, validate } = require("../validations/index");

const router = express.Router();

router.get("/test-endpoint", auth.verifyToken, organizationController.organizationList);
router.post(
  "/connect-to-organization",
  organizationValidation.connectToOrganization(),
  validate,
  organizationController.connectToOrganization
);

module.exports = router;
