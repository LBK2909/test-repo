const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  // console.log("errors==", { errors });
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "validation error", errors: errors.array() });
  }
  next();
};

module.exports = {
  validate,
};

module.exports.authValidation = require("./auth.validation");
