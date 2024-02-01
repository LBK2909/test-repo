// customError.js
class CustomError extends Error {
  constructor(statusCode, message, greeting) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

module.exports = CustomError;
