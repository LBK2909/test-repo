const { body, validationResult } = require("express-validator");

const register = () => {
  return [
    body("name").not().isEmpty().trim().exists(),
    body("email").not().isEmpty().trim().exists(),
    body("password").not().isEmpty().trim().exists(),
  ];
};

const login = () => {
  return [
    body("name").not().isEmpty().trim().exists(),
    body("email").not().isEmpty().trim().exists(),
    body("password").not().isEmpty().trim().exists(),
  ];
};

module.exports = {
  register,
  login,
};
