import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuditDeliveryByReference = vi.fn();
const listDeliveredReportsByEmail = vi.fn();
const getUser = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/page-utility-nav", () => ({
  PageUtilityNav: () => <div>nav</div>,
}));

vi.mock("@/components/report-auto-refresh", () => ({
  ReportAutoRefresh: () => null,
}));

vi.mock("@/components/account-access-form", () => ({
  AccountAccessForm: () => <form>account access</form>,
}));

vi.mock("@/lib/audit-delivery", () => ({
  getAuditDeliveryByReference,
  listDeliveredReportsByEmail,
}));

vi.mock("@/lib/supabase-auth", () => ({
  createServerAuthClient: vi.fn(async () => ({
    auth: {
      getUser: getUser,
      signOut: vi.fn(),
    },
  })),
}));

vi.mock("@/lib/env", () => ({
  appEnv: {
    calendlyUrl: "https://calendly.com/aeospark/30min",
  },
}));

describe("report and account access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the inline report with query-by-query results", async () => {
    getAuditDeliveryByReference.mockResolvedValue({
      order: {
        id: "order_123",
        website: "https://alphawhale.app",
        status: "delivered",
        stripePaymentIntentId: "pi_123",
      },
      report: {
        domain: "alphawhale.app",
        orderDate: "2026-03-22T00:00:00.000Z",
        claudeCitationShare: 35,
        chatgptCitationShare: 25,
        claudeCited: 7,
        chatgptCited: 5,
        competitor1: "CompetitorX",
        competitor1Share: 60,
        competitor2: "CompetitorY",
        competitor2Share: 30,
        queryResults: [
          {
            query: "Best wallet security tool for DeFi teams",
            claude: {
              cited: false,
              competitor_cited: "CompetitorX",
              sentiment: "neutral",
              excerpt: "CompetitorX leads.",
            },
            chatgpt: {
              cited: true,
              competitor_cited: null,
              sentiment: "positive",
              excerpt: "alphawhale.app is strong.",
            },
          },
        ],
        bingIndexed: true,
        bingPageCount: 320,
        braveIndexed: true,
        executiveSummary: "AlphaWhale is under-cited but fixable.",
        gapAnalysis: "Competitors have stronger commercial coverage.",
        topFixes: "1. Add alternatives pages",
        projection: "Citation share can improve in 60 days.",
        generatedAt: "2026-03-22T00:00:00.000Z",
        pdfUrl: "https://storage.example/report.pdf",
      },
      auditId: "audit_1",
    });

    const ReportPage = (await import("@/app/report/[orderId]/page")).default;
    const html = renderToStaticMarkup(
      await ReportPage({ params: Promise.resolve({ orderId: "pi_123" }) }),
    );

    expect(html).toContain("What AI says when your buyers ask");
    expect(html).toContain("CompetitorX");
    expect(html).toContain("Cited ✓");
  });

  it("renders delivered reports in the buyer account", async () => {
    getUser.mockResolvedValue({ data: { user: { email: "buyer@example.com" } } });
    listDeliveredReportsByEmail.mockResolvedValue([
      {
        orderId: "order_123",
        reference: "pi_123",
        domain: "alphawhale.app",
        deliveredAt: "2026-03-22T00:00:00.000Z",
        reportUrl: "https://storage.example/report.pdf",
        report: {
          claudeCited: 7,
          chatgptCited: 5,
        },
      },
    ]);

    const AccountPage = (await import("@/app/account/page")).default;
    const html = renderToStaticMarkup(await AccountPage());

    expect(html).toContain("Your delivered reports");
    expect(html).toContain("alphawhale.app");
    expect(html).toContain("View Report");
    expect(html).toContain("Download PDF");
  });
});
