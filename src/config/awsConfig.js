const AWS = require("aws-sdk");

// JS SDK v3 does not support global configuration.
// Codemod has attempted to pass values to each service client in this file.
// You may need to update clients outside of this file, if they use global config.
// AWS.config.update({
//   region: process.env.AWS_REGION,
//   accessKeyId: process.env.AWS_PROG_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_PROG_SECRET_ACCESS_KEY,
// });

const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_PROG_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_PROG_SECRET_ACCESS_KEY,
  },
};
module.exports = awsConfig;
