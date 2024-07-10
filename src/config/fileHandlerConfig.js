// multerConfig.js
const multer = require("multer");

// Configure multer for handling multipart/form-data
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  storage: multer.memoryStorage(), // Using memory storage for demonstration, change as needed
});

module.exports = upload;
