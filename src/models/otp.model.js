const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expirationTime: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "emailVer",
      "pwdReset",
      "2FA",
      "phoneVer",
      "txnAuth",
      "acctRecov",
      "deviceAuth",
      "payConf",
      "sessReauth",
      "appEnroll",
      "apiAcc",
      "subsConf",
      "userActVer",
      "contestPart",
      "eventReg",
    ],
    required: true,
  },
});

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
