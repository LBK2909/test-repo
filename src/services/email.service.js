const awsConfig = require("../config/awsConfig");
const AWS = require("aws-sdk");
const ses = new AWS.SES(awsConfig);
const { imageToBase64 } = require("../utils/util.js");
const path = require("path");
const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);
/*
 * Generate the HTML content for the verification email.
 * @param {string} verificationCode - The verification code to be included in the email.
 * @returns {string} - The HTML content of the email.
 */
const generateVerificationEmailTemplate = async (verificationCode) => {
  const companyLogo = await getCompanyLogo();
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 50px auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .header img {
          max-width: 150px;
          margin-bottom: 20px;
        }
        .content h1 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #333333;
        }
        .content p {
          font-size: 16px;
          color: #666666;
          margin-bottom: 20px;
        }
        .verification-code {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 30px;
          color: #333333;
        }
        .footer {
          margin-top: 20px;
          font-size: 14px;
          color: #999999;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
        .social-icons img {
          width: 24px;
          height: 24px;
          margin: 0 5px;
          vertical-align: middle;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
      <img src="${companyLogo}" width='150' height='75' alt="log Logo">
        </div>
        <div class="content">
          <h1>Verify your email</h1>
          <p>Please use the code below to verify your email address.</p>
          <div class="verification-code">${verificationCode}</div>
        </div>
  
        <div class="footer" style="margin-top: 10px">
        <p>10 Schalks Crossing Rd,Plainsboro, NJ 08536, United States</p>
      </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
const resetPasswordTemplate = async (resetLink) => {
  const companyLogo = await getCompanyLogo();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f7f7f7;
              margin: 0;
              padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          .link-btn {
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              background: linear-gradient(45deg, #275499, #2871df) !important;
              color: white;
              font-weight: bold !important;
              width:300px;
              text-align:center;    
          }
          .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666666;
          }
          .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #999999;
          }
          .footer a {
            color: #007bff;
            text-decoration: none;
          }
          .container h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #333333;
          }
          .container p {
            font-size: 16px;
            margin-bottom: 20px;
          }
          .main p {
            font-size: 16px;
            color: #666666;
            margin-bottom: 20px;
          }
      </style>
  </head>
  <body>
  <div class="container">
  <div class="header">
    <img src="${companyLogo}" width="150" height="75" alt="log Logo" />
  </div>
    <div class="main">
    <h1>Password Reset Request</h1>
    <p>Hello, We received a request to reset your password.</p>
    <p>Click the button below to reset it:</p>
    <div style="margin: 30px auto">
      <a href="${resetLink}" class="link-btn" style="margin: 10px auto">Reset Password</a>
    </div>
    <p>If you didn't request a password reset, please ignore this email.</p>
    </div>
    </div>
  </body>
  </html>  
    `;
};

/**
 * Send a verification email.
 * @param {string} to - The recipient's email address.
 * @param {string} verificationCode - The verification code to be included in the email.
 */
const sendVerificationEmail = async (to, verificationCode) => {
  const emailHtml = await generateVerificationEmailTemplate(verificationCode);
  const params = {
    Source: process.env.SES_SENDER_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: "Email Verification",
      },
      Body: {
        Html: {
          Data: emailHtml.toString(),
        },
      },
    },
  };

  try {
    // The `.promise()` call might be on an JS SDK v2 client API.
    // If yes, please remove .promise(). If not, remove this comment.
    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    return false;
  }
};
const sendResetPasswordEmail = async (to, resetLink) => {
  const passwordTemplate = await resetPasswordTemplate(resetLink);

  const params = {
    Source: process.env.SES_SENDER_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: "Password Reset",
      },
      Body: {
        Html: {
          Data: passwordTemplate.toString(),
        },
      },
    },
  };

  try {
    // The `.promise()` call might be on an JS SDK v2 client API.
    // If yes, please remove .promise(). If not, remove this comment.
    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    return false;
  }
};

async function getCompanyLogo() {
  const assetsDir = path.join(process.cwd(), "src/assets");
  const BrandLogoImagePath = path.join(assetsDir, "cobayLogo.png");
  const base64Image = await imageToBase64(BrandLogoImagePath);
  return base64Image;
}
module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
