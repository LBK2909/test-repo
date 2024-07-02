require("dotenv").config({ path: ".env" });

const http = require("http");
const https = require("https");
const fs = require("fs");
const certPath = process.env.SSL_CERT_PATH;
const app = require("./app");

var options = {
  key: fs.readFileSync(`${certPath}/privkey.pem`),
  cert: fs.readFileSync(`${certPath}/fullchain.pem`),
};

http.createServer(app).listen(80, () => {
  console.log("HTTP server running on port 80");
});
https.createServer(options, app).listen(443, () => {
  console.log("HTTPS server running on port 443");
});
