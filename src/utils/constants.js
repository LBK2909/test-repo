// constants.js
const OTP_TYPES = {
  EMAIL_VERIFICATION: "emailVer",
  PASSWORD_RESET: "pwdReset",
  TWO_FACTOR_AUTH: "2FA",
  PHONE_VERIFICATION: "phoneVer",
  TRANSACTION_AUTHORIZATION: "txnAuth",
  ACCOUNT_RECOVERY: "acctRecov",
  DEVICE_AUTHENTICATION: "deviceAuth",
  PAYMENT_CONFIRMATION: "payConf",
  SESSION_REAUTHENTICATION: "sessReauth",
  APPLICATION_ENROLLMENT: "appEnroll",
  API_ACCESS: "apiAcc",
  SUBSCRIPTION_CONFIRMATION: "subsConf",
  USER_ACTIVITY_VERIFICATION: "userActVer",
  CONTEST_PARTICIPATION: "contestPart",
  EVENT_REGISTRATION: "eventReg",
};

// // Other related constants

// const OTP_EXPIRATION_TIMES = {
//   SHORT: 5 * 60 * 1000, // 5 minutes
//   MEDIUM: 10 * 60 * 1000, // 10 minutes
//   LONG: 30 * 60 * 1000, // 30 minutes
// };

// const EMAIL_TEMPLATES = {
//   VERIFY_EMAIL: "verifyEmailTemplate",
//   RESET_PASSWORD: "resetPasswordTemplate",
//   TWO_FACTOR_AUTH: "twoFactorAuthTemplate",
// };

// const SMS_TEMPLATES = {
//   VERIFY_PHONE: "verifyPhoneTemplate",
//   TRANSACTION_AUTHORIZATION: "transactionAuthorizationTemplate",
// };

// const DEFAULTS = {
//   OTP_LENGTH: 6,
//   OTP_CHARACTERS: "0123456789", // Digits only, can be extended to include letters
// };

module.exports = {
  OTP_TYPES,
  //   OTP_EXPIRATION_TIMES,
  //   EMAIL_TEMPLATES,
  //   SMS_TEMPLATES,
  //   DEFAULTS,
};
