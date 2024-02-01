require("dotenv").config({ path: ".env.production" });
const app = require("./src/app");

// Remote AWS server configuration

const http = require("http");
const https = require("https");
const fs = require("fs");
const certPath = "/etc/letsencrypt/live/api.cobay.com";

var options = {
  key: fs.readFileSync(`${certPath}/privkey.pem`),
  cert: fs.readFileSync(`${certPath}/fullchain.pem`),
};

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);
