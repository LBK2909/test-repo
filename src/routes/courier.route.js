const express = require("express");

const { courierController } = require("../controllers/index");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/couriers", auth.verifyToken, courierController.getCouriers);
router.get("/courier/:id", auth.verifyToken, courierController.getCourier);
router.post("/courier", auth.verifyToken, courierController.addCourier);
router.get("/get-couriers-by-organization", courierController.getCouriersByOrganization);
router.get("/get-courier-by-organization/:id", courierController.getCourierByOrganization);
router.get("/get-crypkeys", async (req, res) => {
  res.send({ crykey: process.env.CRYKEY });
});
module.exports = router;
