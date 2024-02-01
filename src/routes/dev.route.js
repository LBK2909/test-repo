const express = require("express");

const testController = require("../controllers/test.controller");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/test-endpoint", auth.verifyToken, testController.testMethod);

module.exports = router;
