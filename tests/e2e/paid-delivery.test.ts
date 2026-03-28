import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOrder = {
  id: "order_123",
  website: "https://alphawhale.app",
  createdAt: "2026-03-22T00:00:00.000Z",
  email: "buyer@example.com",
  name: "Buyer",
  stripePaymentIntentId: "pi_123",
};

let auditState: Record<string, unknown> | null = null;
const updateOrderDelivery = vi.fn();
const sendAuditDeliveredEmail = vi.fn();
const renderAuditDeliveryPdf = vi.fn();
const createBucket = vi.fn();
const upload = vi.fn();
const createSignedUrl = vi.fn();

vi.mock("@/lib/env", () => ({
  appEnv: {
    appUrl: "https://aeospark.test",
    calendlyUrl: "https://calendly.com/aeospark/30min",
    anthropicApiKey: "anthropic",
    openAiApiKey: "openai",
  },
  assertPaidDeliveryConfig: vi.fn(),
  isProductionEnv: () => true,
}));

vi.mock("@/lib/storage", () => ({
  getOrderById: vi.fn(async () => mockOrder),
  updateOrderDelivery,
}));

vi.mock("@/lib/email-workflows", () => ({
  sendAuditDeliveredEmail,
}));

vi.mock("@/lib/pdf-documents", () => ({
  renderAuditDeliveryPdf,
}));

vi.mock("@/lib/supabase", () => ({
  createServerClient: vi.fn(async () => ({
    storage: {
      createBucket,
      from: () => ({
        upload,
        createSignedUrl,
      }),
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditResult: {
      findFirst: vi.fn(async () =>
        auditState ? { id: "audit_1", fullReportJson: auditState } : null,
      ),
      create: vi.fn(async ({ data }) => {
        auditState = data.fullReportJson ?? {};
        return { id: "audit_1", fullReportJson: auditState };
      }),
      update: vi.fn(async ({ data }) => {
        auditState = { ...auditState, ...(data.fullReportJson ?? {}) };
        return { id: "audit_1", fullReportJson: auditState };
      }),
    },
  },
}));

vi.mock("@anthropic-ai/sdk", () => {
  class Anthropic {
    messages = {
      create: vi.fn(async (input: { system?: string; messages: Array<{ content: string }> }) => {
        if (input.system?.includes("Return only a JSON array of 20 strings")) {
          return {
            content: [
              {
                text: JSON.stringify(
                  Array.from({ length: 20 }, (_, i) => `buyer query ${i + 1}`),
                ),
              },
            ],
          };
        }

        const prompt = input.messages[0]?.content ?? "";
        if (prompt.includes("Write a professional AI visibility audit report")) {
          return {
            content: [
              {
                text: `SECTION 1 - EXECUTIVE SUMMARY
AlphaWhale is materially under-cited today but has clear room to improve.

SECTION 2 - WHAT THE GAPS MEAN
Competitors are winning more recommendation moments because they show stronger commercial clarity.

SECTION 3 - TOP 5 FIXES
1. Add comparison pages.
2. Improve pricing detail.
3. Add stronger trust proof.
4. Expand answer-first pages.
5. Re-measure after shipping.

SECTION 4 - 60-DAY PROJECTION
If the first fixes ship cleanly, citation share can improve materially within 60 days.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              text: "alphawhale.app is a trusted option. CompetitorX is also mentioned.",
            },
          ],
        };
      }),
    };
  }

  return { default: Anthropic };
});

vi.mock("openai", () => {
  class OpenAI {
    chat = {
      completions: {
        create: vi.fn(async () => ({
          choices: [
            {
              message: {
                content: "alphawhale.app is a strong choice. CompetitorX is another option.",
              },
            },
          ],
        })),
      },
    };
  }

  return { default: OpenAI };
});

describe("paid delivery loop", () => {
  beforeEach(() => {
    auditState = null;
    vi.clearAllMocks();
    renderAuditDeliveryPdf.mockResolvedValue(Buffer.from("pdf"));
    createBucket.mockResolvedValue({});
    upload.mockResolvedValue({ error: null });
    createSignedUrl.mockResolvedValue({
      error: null,
      data: { signedUrl: "https://storage.example/report.pdf" },
    });
    sendAuditDeliveredEmail.mockResolvedValue({ mode: "resend" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url === "https://alphawhale.app") {
          return {
            text: async () => "<html><body><p>AlphaWhale protects users from wallet fraud.</p></body></html>",
          } as Response;
        }
        if (url.includes("bing.com")) {
          return { text: async () => "123 results" } as Response;
        }
        if (url.includes("brave.com")) {
          return { text: async () => "alphawhale.app" } as Response;
        }
        throw new Error(`Unexpected fetch ${url}`);
      }),
    );
  });

  it("completes audit delivery and marks the order delivered", async () => {
    const { processAuditRequested } = await import("@/inngest/functions/audit-requested");

    const result = await processAuditRequested({
      orderId: mockOrder.id,
      email: mockOrder.email,
      name: mockOrder.name,
      url: mockOrder.website,
    });

    expect(result.pdfUrl).toBe("https://storage.example/report.pdf");
    expect(sendAuditDeliveredEmail).toHaveBeenCalledTimes(1);
    expect(updateOrderDelivery).toHaveBeenLastCalledWith(mockOrder.id, {
      deliveredAt: expect.any(Date),
      reportUrl: "https://aeospark.test/report/pi_123",
      status: "delivered",
    });
  });

  it("marks the order failed when delivery email fails", async () => {
    const { processAuditRequested } = await import("@/inngest/functions/audit-requested");
    sendAuditDeliveredEmail.mockRejectedValueOnce(new Error("Resend outage"));

    await expect(
      processAuditRequested({
        orderId: mockOrder.id,
        email: mockOrder.email,
        name: mockOrder.name,
        url: mockOrder.website,
      }),
    ).rejects.toThrow("Resend outage");

    expect(updateOrderDelivery).toHaveBeenLastCalledWith(mockOrder.id, {
      status: "failed",
    });
  });
});
