import { getOrderByReference } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export type ProviderQueryAudit = {
  cited: boolean;
  competitor_cited: string | null;
  sentiment: string;
  excerpt: string;
};

export type QueryAuditRow = {
  query: string;
  claude: ProviderQueryAudit | null;
  chatgpt: ProviderQueryAudit | null;
};

export interface AuditReportData {
  domain: string;
  orderDate: string;
  claudeCitationShare: number;
  chatgptCitationShare: number;
  claudeCited: number;
  chatgptCited: number;
  competitor1: string | null;
  competitor1Share: number;
  competitor2: string | null;
  competitor2Share: number;
  queryResults: QueryAuditRow[];
  bingIndexed: boolean;
  bingPageCount: number;
  braveIndexed: boolean;
  executiveSummary: string;
  gapAnalysis: string;
  topFixes: string;
  projection: string;
  generatedAt: string;
  auditStep?: string;
  pdfUrl?: string | null;
  reportUrl?: string | null;
}

function numberValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber(): number }).toNumber();
  }
  return 0;
}

function parseReportData(value: unknown): AuditReportData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const report = value as Partial<AuditReportData>;
  if (!report.domain || !Array.isArray(report.queryResults)) {
    return null;
  }

  return {
    domain: report.domain,
    orderDate: report.orderDate || new Date().toISOString(),
    claudeCitationShare: numberValue(report.claudeCitationShare),
    chatgptCitationShare: numberValue(report.chatgptCitationShare),
    claudeCited: numberValue(report.claudeCited),
    chatgptCited: numberValue(report.chatgptCited),
    competitor1: report.competitor1 ?? null,
    competitor1Share: numberValue(report.competitor1Share),
    competitor2: report.competitor2 ?? null,
    competitor2Share: numberValue(report.competitor2Share),
    queryResults: report.queryResults as QueryAuditRow[],
    bingIndexed: Boolean(report.bingIndexed),
    bingPageCount: numberValue(report.bingPageCount),
    braveIndexed: Boolean(report.braveIndexed),
    executiveSummary: report.executiveSummary || "",
    gapAnalysis: report.gapAnalysis || "",
    topFixes: report.topFixes || "",
    projection: report.projection || "",
    generatedAt: report.generatedAt || new Date().toISOString(),
    auditStep: report.auditStep,
    pdfUrl: report.pdfUrl ?? null,
    reportUrl: report.reportUrl ?? null,
  };
}

export async function getAuditDeliveryByOrderId(orderId: string) {
  const row = await prisma.auditResult.findFirst({ where: { orderId } });
  if (!row) {
    return undefined;
  }

  return {
    row,
    report: parseReportData(row.fullReportJson),
  };
}

export async function getAuditDeliveryByReference(orderReference: string) {
  const order = await getOrderByReference(orderReference);
  if (!order) {
    return undefined;
  }

  const delivery = await getAuditDeliveryByOrderId(order.id);

  return {
    order,
    report: delivery?.report ?? null,
    auditId: delivery?.row.id,
  };
}

export async function listDeliveredReportsByEmail(email: string) {
  const orders = await prisma.order.findMany({
    where: {
      email,
      status: "delivered",
    },
    orderBy: { createdAt: "desc" },
  });

  const deliveries = await Promise.all(
    orders.map(async (row) => {
      const delivery = await getAuditDeliveryByOrderId(row.id);
      return {
        orderId: row.id,
        reference: row.stripePaymentIntentId,
        domain: new URL(row.url).hostname.replace(/^www\./, ""),
        deliveredAt: row.deliveredAt?.toISOString() || row.createdAt.toISOString(),
        reportUrl: row.reportUrl,
        report: delivery?.report ?? null,
      };
    }),
  );

  return deliveries;
}
