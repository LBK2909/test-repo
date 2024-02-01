const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");

exports.testMethod = catchAsync(async (req, res) => {
  res.status(httpStatus.CREATED).send({ message: "Test method" });
});
// module.exports = {
//   testMethod,
// };
// exports.getOrdersSummary =
