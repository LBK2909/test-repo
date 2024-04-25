const { body, validationResult } = require("express-validator");

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

module.exports = {
  register,
  login,
  registerViaShopify,
};
