const AWS = require("../config/awsConfig");
const ses = new AWS.SES();

/*
 * Generate the HTML content for the verification email.
 * @param {string} verificationCode - The verification code to be included in the email.
 * @returns {string} - The HTML content of the email.
 */
const generateVerificationEmailTemplate = (verificationCode) => {
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
          <img src="https://yourcompany.com/logo.png" alt="Your Company Logo">
        </div>
        <div class="content">
          <h1>Verify your email</h1>
          <p>Please use the code below to verify your email address on YourCompany.</p>
          <div class="verification-code">${verificationCode}</div>
        </div>
        <div class="footer">
          <div class="social-icons">
            <a href="#"><img src="https://yourcompany.com/icons/linkedin.png" alt="LinkedIn"></a>
            <a href="#"><img src="https://yourcompany.com/icons/twitter.png" alt="Twitter"></a>
            <a href="#"><img src="https://yourcompany.com/icons/facebook.png" alt="Facebook"></a>
            <a href="#"><img src="https://yourcompany.com/icons/instagram.png" alt="Instagram"></a>
            <a href="#"><img src="https://yourcompany.com/icons/youtube.png" alt="YouTube"></a>
            <a href="#"><img src="https://yourcompany.com/icons/tiktok.png" alt="TikTok"></a>
          </div>
          <p>24/7 Live chat | <a href="https://yourcompany.com/blog">Read our blog</a></p>
          <p>2711 Centerville Road, Wilmington, Delaware 19808, United States</p>
          <p>&copy; 2024 YourCompany</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
const resetPasswordTemplate = (resetLink) => {
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
              background-color: #ffffff;
              padding: 20px;
              border-radius: 5px;
              max-width: 600px;
              margin: auto;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .button {
              background-color: #007bff;
              color: #ffffff;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
          }
          .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666666;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to reset it:</p>
          <a href=${resetLink} class="button">Reset Password</a>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Thanks,<br>Your Company Team</p>
          <div class="footer">
              <p>If you have any questions, feel free to contact our support team.</p>
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
  const emailHtml = generateVerificationEmailTemplate(verificationCode);

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
          Data: emailHtml,
        },
      },
    },
  };

  try {
    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    return false;
  }
};
const sendResetPasswordEmail = async (to, resetLink) => {
  const passwordTemplate = resetPasswordTemplate(resetLink);

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
          Data: passwordTemplate,
        },
      },
    },
  };

  try {
    await ses.sendEmail(params).promise();
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${to}:`, error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
