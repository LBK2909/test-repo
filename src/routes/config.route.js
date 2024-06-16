const express = require("express");

const { configController } = require("../controllers/index");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/boxes", auth.verifyToken, configController.createBox);
router.get("/boxes", auth.verifyToken, configController.getBoxes);
router.get("/boxes/:boxId", auth.verifyToken, configController.getBoxById);
router.put("/boxes/:boxId", auth.verifyToken, configController.updateBox);
router.delete("/boxes/:boxId", auth.verifyToken, configController.deleteBox);
module.exports = router;
