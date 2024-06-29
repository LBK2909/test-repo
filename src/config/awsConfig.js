const AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_PROG_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_PROG_SECRET_ACCESS_KEY,
});

module.exports = AWS;
