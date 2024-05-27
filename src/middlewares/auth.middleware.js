const jwt = require("jsonwebtoken");
const config = require("../config/config");
const httpStatus = require("http-status");

exports.verifyToken = (req, res, next) => {
  console.log("verifyToken middleware..");

  let jwtConfigToken = config.jwt.secret || null;
  if (!jwtConfigToken) {
    return res.status(httpStatus["503_NAME"]).send({ message: "Unauthorized!" });
  }
  let token = req.headers["access-token"];
  let cookieToken = req.cookies["accessToken"];
  console.log("cookieToken...");
  console.log({ cookieToken });
  if (!cookieToken) {
    return res.status(403).send({ message: "No token provided!" });
  }
  jwt.verify(cookieToken, config.jwt.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    next();
  });
};
exports.verifyUserOrganization = async (req, res, next) => {
  console.log("verify organization method...");
  next();
  return;
  // Get the cookie token
  let userId = req.cookies["userId"];
  let organizationId = req.cookies["organizationId"];
  if (!userId || !organizationId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: "User ID and organization ID are required" });
  }
  //query the user collection to check if the user belongs to the organization
  let user = await User.findById(userId);
  if (!user) return res.status(httpStatus.NOT_FOUND).send({ message: "User not found" });

  //check if the user has the necessary information to connect the store
  let userOrganization = user.organizations || [];
  const organizationRole = userOrganization.find((org) => org.organizationId.toString() === organizationId.toString());
  //if the orgnaizationRole is true   then the user has the permission to connect the store
  if (!organizationRole) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).send({ message: "User does not have permission to update store" });
  }
};
