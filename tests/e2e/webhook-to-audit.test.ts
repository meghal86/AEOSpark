import { beforeEach, describe, expect, it, vi } from "vitest";

const createOrder = vi.fn();
const getOrderByStripePaymentIntent = vi.fn();
const sendAuditConfirmationEmail = vi.fn();
const processAuditRequested = vi.fn();
const inngestSend = vi.fn();

vi.mock("@/lib/env", () => ({
  appEnv: {
    stripeWebhookSecret: "whsec_test",
    inngestEventKey: "",
  },
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: vi.fn(() => ({
        type: "checkout.session.completed",
        data: {
          object: {
            payment_intent: "pi_test_123",
            customer_details: { email: "buyer@example.com" },
            metadata: {
              name: "Buyer",
              url: "https://alphawhale.app",
            },
          },
        },
      })),
    },
  }),
}));

vi.mock("@/lib/storage", () => ({
  createOrder,
  getOrderByStripePaymentIntent,
  setClientActiveBySubscriptionId: vi.fn(),
}));

vi.mock("@/lib/email-workflows", () => ({
  sendAuditConfirmationEmail,
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    send: inngestSend,
  },
}));

vi.mock("@/inngest/functions/audit-requested", () => ({
  processAuditRequested,
}));

describe("stripe webhook delivery kickoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrderByStripePaymentIntent.mockResolvedValue(undefined);
    createOrder.mockResolvedValue({
      id: "order_123",
      email: "buyer@example.com",
      name: "Buyer",
      url: "https://alphawhale.app",
    });
    sendAuditConfirmationEmail.mockResolvedValue({ mode: "resend" });
    processAuditRequested.mockResolvedValue(undefined);
  });

  it("creates the order and triggers audit processing", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const response = await POST(
      new Request("https://aeospark.test/api/stripe/webhook", {
        method: "POST",
        headers: {
          "stripe-signature": "sig",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(200);
    expect(createOrder).toHaveBeenCalledWith({
      email: "buyer@example.com",
      name: "Buyer",
      url: "https://alphawhale.app",
      stripePaymentIntentId: "pi_test_123",
      amountCents: 99_700,
      status: "pending",
    });
    expect(processAuditRequested).toHaveBeenCalledWith({
      orderId: "order_123",
      email: "buyer@example.com",
      name: "Buyer",
      url: "https://alphawhale.app",
    });
    expect(sendAuditConfirmationEmail).toHaveBeenCalledOnce();
  });
});
