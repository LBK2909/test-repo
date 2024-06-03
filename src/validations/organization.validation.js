const { body, validationResult } = require("express-validator");

const connectToOrganization = () => {
  return [body("shop").not().isEmpty().trim().exists()];
};
const connectCourierToOrganization = () => {
  return [
    body("courierId").not().isEmpty().withMessage("A valid courier ID is required"),
    body("credentials").not().isEmpty().withMessage("Credentials are required and cannot be empty"),
  ];
};
module.exports = {
  connectToOrganization,
  connectCourierToOrganization,
};
