const express = require("express");

const { billingController } = require("../../controllers/index");
const { billingValidation, validate } = require("../../validations/index");

const router = express.Router();

router.get("/plans", billingController.getPlans);
router.post(
  "/create-order-custom-plan",
  billingValidation.validateCustomOrderCreation(),
  validate,
  billingController.createOrderCustomPlan
);

router.post("/plan", billingValidation.validatePlan(), validate, billingController.addPlan);
router.put("/plan/:id", billingController.updatePlan);
router.delete("/plan/:id", billingController.deletePlan);
router.get("/plan/:id", billingController.getPlan);
router.post("/subscribe", billingController.subscribe);
router.post("/unsubscribe", billingController.unsubscribe);
router.post("/create-order", billingController.createOrder);

module.exports = router;
