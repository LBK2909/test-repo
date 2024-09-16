const { body, validationResult, query } = require("express-validator");

const register = () => {
  return [
    body("organizationName").not().isEmpty().trim().exists(),
    body("email").not().isEmpty().trim().exists(),
    body("password")
      .not()
      .isEmpty()
      .trim()
      .exists()
      .custom((value) => {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error("Password must contain at least one letter and one number");
        }
        return true;
      }),
    body("country").not().isEmpty().trim().exists(),
  ];
};

const login = () => {
  return [body("email").not().isEmpty().trim().exists(), body("password").not().isEmpty().trim().exists()];
};
const registerViaShopify = () => {
  return [
    body("companyName").not().isEmpty().trim().exists(),
    body("email").not().isEmpty().trim().exists(),
    body("password").not().isEmpty().trim().exists(),
    body("phoneNumber").not().isEmpty().trim().exists(),
    //get the query  params (mail and shop)
    body("queryShop").not().isEmpty().trim().exists(),
    body("queryMail").not().isEmpty().trim().exists(),
  ];
};
const forgotPassword = () => {
  return [query("email").not().isEmpty().trim().exists().withMessage("Email is required")];
};
const resetPassword = () => {
  return [body("password").not().isEmpty().trim().exists(), body("token").not().isEmpty().trim().exists()];
};
const verifyOTP = () => {
  return [body("otp").not().isEmpty().trim().exists(), body("email").not().isEmpty().trim().exists()];
};
const sendVerificationEmail = () => {
  return [body("email").not().isEmpty().trim().exists()];
};
const checkEmailExists = () => {
  return [body("email").not().isEmpty().trim().exists()];
};

module.exports = {
  register,
  login,
  registerViaShopify,
  forgotPassword,
  resetPassword,
  verifyOTP,
  sendVerificationEmail,
  checkEmailExists,
};
