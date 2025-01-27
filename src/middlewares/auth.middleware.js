const jwt = require("jsonwebtoken");
const config = require("../config/config");
const httpStatus = require("http-status");
const { User } = require("../models");
exports.verifyToken = (req, res, next) => {
  let jwtConfigToken = config.jwt.secret || null;
  if (!jwtConfigToken) {
    return res.status(httpStatus["503_NAME"]).send({ message: "Unauthorized!" });
  }
  let token = req.headers["access-token"];
  let cookieToken = req.cookies["accessToken"];
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
  // Get the cookie token
  let userId = parseInt(req.cookies["userId"]);
  let organizationId = parseInt(req.cookies["orgId"]);
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
  if (organizationRole) {
    next();
  } else {
    return res.status(httpStatus.FORBIDDEN).send({ message: "User does not have permission to update store" });
  }
};
