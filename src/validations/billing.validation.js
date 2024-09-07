const { body, validationResult } = require("express-validator");

exports.validatePlan = () => {
  return [
    // Name validation
    body("name").notEmpty().withMessage("Name is required").isString().trim().withMessage("Name must be a string"),

    // Price validation
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),

    // Order count validation
    body("order_count")
      .optional() // It's optional because it has a default value
      .isInt({ min: 0 })
      .withMessage("Order count must be a non-negative integer"),

    // Currency validation
    body("currency").isIn(["USD", "INR"]).withMessage("Invalid currency"),

    // Billing cycle validation
    body("billing_cycle").isIn(["monthly", "annual"]).withMessage("Invalid billing cycle"),

    // Duration validation
    body("duration")
      .optional() // It's optional because it has a default value
      .isInt({ min: 1 })
      .withMessage("Duration must be a positive integer"),

    // Features validation
    body("features")
      .optional() // It's optional because it's an array and can be empty
      .isArray()
      .withMessage("Features must be an array of strings")
      .custom((value) => {
        return value.every((feature) => typeof feature === "string");
      })
      .withMessage("Each feature must be a string"),

    // isActive validation
    body("isActive")
      .optional() // It's optional because it has a default value
      .isBoolean()
      .withMessage("isActive must be a boolean value"),

    // Description validation
    body("description").notEmpty().withMessage("Description is required").isString().withMessage("Description must be a string"),
  ];
};

exports.validateCustomOrderCreation = () => {
  return [body("orders").isNumeric().withMessage("Order must be a number")];
};
// Middleware to check validation results
exports.checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: "fail", errors: errors.array() });
  }
  next();
};
