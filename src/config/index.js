require("dotenv").config();

module.exports = {
  secret: process.env.secretKey,
  env: process.env.NODE_ENV,
  jwt: {
    secret: process.env.secretKey,
    accessExpirationDays: 1,
    refreshExpirationDays: 1,
    // resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    // verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  mongoose: {
    url: process.env.MONGODB_URL,
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
};
