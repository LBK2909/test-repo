const { body, validationResult } = require("express-validator");

const connectToOrganization = () => {
  return [
    body("organizationId").not().isEmpty().trim().exists(),
    body("userId").not().isEmpty().trim().exists(),
    body("shop").not().isEmpty().trim().exists(),
  ];
};
module.exports = {
  connectToOrganization,
};
