module.exports.authController = require("./auth.controller");
module.exports.userController = require("./user.controller");
module.exports.testController = require("./test.controller");
module.exports.organization = require("./organization.controller");
module.exports.shippingController = require("./shipping.controller");
module.exports.orderController = require("./orders.controller");
module.exports.courierController = require("./courier.controller");
module.exports.configController = require("./config.controller");
module.exports.shopifyController = require("./salesChannels/shopify.controller");
module.exports.billingController = require("./billing/index");
module.exports.razorpayController = require("./billing/paymentGateway/razorPay.controller.js");
module.exports.stripeController = require("./billing/paymentGateway/stripe.controller.js");
