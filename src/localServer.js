require("dotenv").config({ path: ".env.development" });
// Start the local server
// const PORT = process.env.PORT || 80;
// app.listen(PORT, () => {
//   console.log(`App listening on port ${PORT}`);
//   console.log("Press Ctrl+C to quit.");
// });

const http = require("http");
const https = require("https");
const fs = require("fs");
const app = require("./app");
const path = require("path");
// const certPath = "./certs";
const keyPath = path.resolve(__dirname, "./localhost-key.pem");
const certPath = path.resolve(__dirname, "./localhost.pem");
var options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};
// http.createServer(app).listen(80);
// https.createServer(options, app).listen(443);
https.createServer(options, app).listen(443, () => {
  console.log("HTTPS server running on port 443");
});
