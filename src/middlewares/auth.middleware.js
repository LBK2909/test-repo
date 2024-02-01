const jwt = require("jsonwebtoken");
const config = require("../config/config");
const httpStatus = require("http-status");

exports.verifyToken = (req, res, next) => {
  let jwtConfigToken = config.jwt.secret || null;
  if (!jwtConfigToken) {
    return res.status(httpStatus["503_NAME"]).send({ message: "Unauthorized!" });
  }
  let token = req.headers["access-token"];
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }
  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};
