const express = require("express");

const { shopifyController } = require(__basedir + "/controllers/index");
// const auth = require("../../middlewares/auth");
const auth = require("../middlewares/auth.middleware");
const { route } = require("./common.route");

const router = express.Router();

// router.get("shop/uninstall", shopifyController.uninstallShop);
router.get("/shop/uninstall/:shopId", shopifyController.uninstallShop);

module.exports = router;
