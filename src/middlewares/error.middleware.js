// errorMiddleware.js
const CustomError = require("../utils/customError");
const httpStatus = require("http-status");
const mongoose = require("mongoose");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof CustomError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new CustomError(statusCode, message);
    console.log(error);
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let customErrorMessage = err.message || "Something went wrong. Please try again later.";
  let customErrorStatusCode = err.statusCode || 503;
  res.status(customErrorStatusCode).json({ status: customErrorStatusCode, message: customErrorMessage });
};

module.exports = {
  errorConverter,
  errorHandler,
};
