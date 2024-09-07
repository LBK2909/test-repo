const stripeController = require("../../../../src/controllers/billing/paymentGateway/stripe.controller");
describe("Stripe Controller - handleWebhookEvent", () => {
  let consoleSpy;

  beforeEach(() => {
    // Spy on console.log to track its calls
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log after each test
    consoleSpy.mockRestore();
  });

  it("should handle payment_intent.succeeded event", () => {
    const paymentIntent = { id: "pi_123", amount: 1000 };
    const event = {
      type: "payment_intent.succeeded",
      data: { object: paymentIntent },
    };

    stripeController.handleWebhookEvent(event);

    // Check if console.log was called with correct arguments
    expect(consoleSpy).toHaveBeenCalledWith("PaymentIntent succeeded:", paymentIntent);
  });

  it("should handle payment_method.attached event", () => {
    const paymentMethod = { id: "pm_123", type: "card" };
    const event = {
      type: "payment_method.attached",
      data: { object: paymentMethod },
    };

    stripeController.handleWebhookEvent(event);

    // Check if console.log was called with correct arguments
    expect(consoleSpy).toHaveBeenCalledWith("PaymentMethod attached:", paymentMethod);
  });

  it("should log unhandled event types", () => {
    const event = {
      type: "unhandled_event_type",
      data: { object: {} },
    };

    stripeController.handleWebhookEvent(event);

    // Check if console.log was called for unhandled event types
    expect(consoleSpy).toHaveBeenCalledWith("Unhandled event type unhandled_event_type");
  });
});
