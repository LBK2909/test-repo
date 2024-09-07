const request = require("supertest");
const express = require("express");
const stripeController = require("../../../../src/controllers/billing/paymentGateway/stripe.controller"); // Adjust path as needed
const Stripe = require("stripe");

const stripe = Stripe(
  "sk_test_51PtOpXP9ujEXTTa21yqUHfEbzV7wPdF5bug7W8HtoFWcbwv1dRQ0OKkd75PZ2H0aIPwW3M69jcr0HLkOjn37phfS00blFULL9u"
);

const app = express();

// Ensure the raw body is used for Stripe signature verification
app.post("/webhooks", express.raw({ type: "application/json" }), stripeController.handleStripeWebhook);

// Common constants
const endpointSecret = "whsec_ocZBkt8mEhYpQh8xWLswASu2DBTvYdly"; // Replace with your actual endpoint secret

// Helper functions
const generateSignature = (payload) => {
  const timestamp = Math.floor(Date.now() / 1000);
  return stripe.webhooks.generateTestHeaderString({
    payload: JSON.stringify(payload),
    secret: endpointSecret,
    timestamp,
  });
};

const sendWebhookRequest = async (payload, signature) => {
  const rawPayload = JSON.stringify(payload);
  return await request(app)
    .post("/webhooks")
    .set("stripe-signature", signature)
    .set("Content-Type", "application/json")
    .send(rawPayload);
};

describe("handleStripeWebhook", () => {
  it("should handle a valid payment_intent.succeeded event and return status 200", async () => {
    const payload = {
      id: "evt_test_webhook",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_intent",
          amount: 1000,
          currency: "usd",
        },
      },
    };

    const signature = generateSignature(payload);
    const response = await sendWebhookRequest(payload, signature);

    // Parse the stringified response body to an object
    const parsedResponse = JSON.parse(response.text);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(parsedResponse).toEqual({ received: true });
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  it("should return 400 when an invalid signature is provided", async () => {
    const payload = {
      id: "evt_test_webhook",
      object: "event",
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test_intent",
          amount: 1000,
          currency: "usd",
        },
      },
    };

    const invalidSignature = "invalid_signature";
    const response = await sendWebhookRequest(payload, invalidSignature);

    // Assertions
    expect(response.statusCode).toBe(400);
    expect(response.text).toContain("Webhook Error");
  });

  it("should handle an unrecognized event type and return status 200", async () => {
    const payload = {
      id: "evt_test_webhook",
      object: "event",
      type: "unrecognized.event",
      data: {
        object: {
          id: "pi_test_intent",
          amount: 1000,
          currency: "usd",
        },
      },
    };

    const signature = generateSignature(payload);
    const response = await sendWebhookRequest(payload, signature);

    // Parse the stringified response body to an object
    const parsedResponse = JSON.parse(response.text);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(parsedResponse).toEqual({ received: true });
    expect(response.headers["content-type"]).toMatch(/json/);
  });
});
