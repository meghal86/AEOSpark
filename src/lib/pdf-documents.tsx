import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { AuditReportData, QueryAuditRow } from "@/lib/audit-delivery";
import type { AuditRecord, ScoreRecord } from "@/lib/types";

export type { AuditReportData } from "@/lib/audit-delivery";

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 34,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#fffdf9",
  },
  cover: {
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 10,
    color: "#8b5e3c",
    textTransform: "uppercase",
    letterSpacing: 2.2,
    marginBottom: 10,
  },
  brand: {
    fontSize: 14,
    color: "#2a190f",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.5,
  },
  domain: {
    fontSize: 28,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
  },
  meta: {
    fontSize: 11,
    color: "#475569",
    marginTop: 6,
  },
  card: {
    border: "1 solid #e5ddd3",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  sectionBody: {
    color: "#334155",
    lineHeight: 1.55,
  },
  table: {
    border: "1 solid #d9cec2",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 14,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f5ede4",
    borderBottom: "1 solid #d9cec2",
  },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #ece5dd",
  },
  altRow: {
    backgroundColor: "#fffcf8",
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  labelCol: {
    width: "40%",
  },
  valueCol: {
    width: "30%",
  },
  smallHeader: {
    fontSize: 9.5,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: "#6b7280",
  },
  bodySmall: {
    fontSize: 9.5,
    color: "#334155",
    lineHeight: 1.45,
  },
  statLine: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1 solid #ece5dd",
    color: "#475569",
    fontSize: 10,
    lineHeight: 1.5,
  },
  queryHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f5ede4",
    borderBottom: "1 solid #d9cec2",
  },
  queryRow: {
    flexDirection: "row",
    borderBottom: "1 solid #f1ebe4",
  },
  queryCell: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  queryTextCol: {
    width: "36%",
  },
  providerCol: {
    width: "32%",
  },
  queryText: {
    fontSize: 9.5,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  statusPill: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 8.5,
    fontWeight: 700,
    marginBottom: 6,
  },
  citedPill: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  competitorPill: {
    backgroundColor: "#ffddd3",
    color: "#c2410c",
  },
  neutralPill: {
    backgroundColor: "#e7e5e4",
    color: "#57534e",
  },
  providerExcerpt: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.35,
  },
  twoCol: {
    flexDirection: "row",
    gap: 14,
    marginTop: 14,
  },
  half: {
    width: "50%",
  },
  fixBlock: {
    border: "1 solid #e5ddd3",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    backgroundColor: "#ffffff",
  },
  footerBand: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f5ede4",
  },
  templateCard: {
    border: "1 solid #e5ddd3",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    backgroundColor: "#ffffff",
  },
  templateCode: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5ede4",
    fontSize: 7.5,
    color: "#2a190f",
    lineHeight: 1.35,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
});

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function clip(text: string, length: number) {
  if (text.length <= length) {
    return text;
  }
  return `${text.slice(0, length - 1)}…`;
}

function splitFixes(topFixes: string) {
  return topFixes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\).\s-]*/, ""))
    .slice(0, 5);
}

function clipTemplateCode(code: string) {
  return clip(code, 560);
}

function providerStatus(provider: QueryAuditRow["claude"]) {
  if (!provider) {
    return {
      label: "No response",
      style: styles.neutralPill,
      excerpt: "Provider response was unavailable during this run.",
    };
  }

  if (provider.cited) {
    return {
      label: "Cited",
      style: styles.citedPill,
      excerpt: provider.excerpt || "The client was mentioned in the response.",
    };
  }

  if (provider.competitor_cited) {
    return {
      label: `Competitor: ${provider.competitor_cited}`,
      style: styles.competitorPill,
      excerpt: provider.excerpt || `${provider.competitor_cited} was cited instead.`,
    };
  }

  return {
    label: "Not mentioned",
    style: styles.neutralPill,
    excerpt: provider.excerpt || "Neither the client nor a specific competitor was mentioned.",
  };
}

function ScoreSummaryDocument({ score }: { score: ScoreRecord }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>AEOSpark summary</Text>
        <Text style={styles.title}>{score.companyName}</Text>
        <Text style={styles.sectionBody}>AEO score: {score.overallScore}/100</Text>
        <Text style={[styles.sectionBody, { marginTop: 10 }]}>{score.executiveSummary}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Top issues</Text>
          {score.dimensions.slice(0, 4).map((dimension) => (
            <View key={dimension.key} style={styles.fixBlock}>
              <Text>{dimension.label}: {dimension.score}/{dimension.weight}</Text>
              <Text style={styles.sectionBody}>{dimension.diagnosis}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function AuditDocument({ audit }: { audit: AuditRecord }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>AEOSpark audit</Text>
        <Text style={styles.title}>{audit.companyName}</Text>
        <Text style={styles.sectionBody}>{audit.executiveSummary}</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Baseline</Text>
          <Text style={styles.sectionBody}>
            Client citation share: {audit.citationBaselinePct}%
          </Text>
          <Text style={styles.sectionBody}>
            Best competitor: {audit.competitorCitationPct}%
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Priority fixes</Text>
          {audit.topFixes.map((fix) => (
            <View key={fix.id} style={styles.fixBlock}>
              <Text>{fix.title}</Text>
              <Text style={styles.sectionBody}>{fix.whyItMatters}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

function AuditDeliveryDocument({ report }: { report: AuditReportData }) {
  const fixes = splitFixes(report.topFixes);

  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View>
          <Text style={styles.brand}>AEOSpark</Text>
          <Text style={styles.eyebrow}>Confidential audit package</Text>
          <Text style={styles.title}>AI Visibility Audit Report</Text>
          <Text style={styles.subtitle}>
            Built from live AI query results, index checks, and competitor citation evidence.
          </Text>
          <Text style={styles.domain}>{report.domain}</Text>
          <Text style={styles.meta}>Prepared on {formatDate(report.generatedAt || report.orderDate)}</Text>
          <Text style={styles.meta}>Confidential — prepared for {report.domain}</Text>
        </View>

        <View style={styles.footerBand}>
          <Text style={styles.sectionBody}>
            This report focuses on the queries where AI assistants are recommending competitors
            instead of you, the structural gaps behind those losses, and the ranked fixes most
            likely to shift citation share over the next 60 days.
          </Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Page 2</Text>
        <Text style={styles.sectionTitle}>Your Citation Share</Text>
        <Text style={styles.sectionBody}>
          This is the first view of how often Claude and ChatGPT cite your brand versus the
          closest competitors across 20 live buyer-intent queries.
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <View style={[styles.cell, styles.labelCol]}>
              <Text style={styles.smallHeader}>Brand</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text style={styles.smallHeader}>Claude</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text style={styles.smallHeader}>ChatGPT</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCol]}>
              <Text>{report.domain}</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text>{formatPercent(report.claudeCitationShare)} ({report.claudeCited}/20)</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text>{formatPercent(report.chatgptCitationShare)} ({report.chatgptCited}/20)</Text>
            </View>
          </View>

          <View style={[styles.row, styles.altRow]}>
            <View style={[styles.cell, styles.labelCol]}>
              <Text>{report.competitor1 || "Top competitor"}</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text>{formatPercent(report.competitor1ClaudeShare ?? report.competitor1Share)}</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text>{formatPercent(report.competitor1ChatgptShare ?? report.competitor1Share)}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCol]}>
              <Text>{report.competitor2 || "Second competitor"}</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text>{formatPercent(report.competitor2ClaudeShare ?? report.competitor2Share)}</Text>
            </View>
            <View style={[styles.cell, styles.valueCol]}>
              <Text>{formatPercent(report.competitor2ChatgptShare ?? report.competitor2Share)}</Text>
            </View>
          </View>
        </View>

        {report.marginOfError != null && report.marginOfError > 0 && (
          <View style={styles.statLine}>
            <Text style={styles.bodySmall}>
              Score confidence: these numbers carry an estimated margin of error of
              {" "}±{report.marginOfError}% based on variance across {report.queryResults.length} queries.
              Re-running the audit may produce slightly different results because AI responses are non-deterministic.
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionBody}>{report.executiveSummary}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.eyebrow}>Page 3</Text>
        <Text style={styles.sectionTitle}>What AI Says When Your Buyers Ask</Text>
        <Text style={styles.sectionBody}>
          20 real buyer-intent queries. Results captured on {formatDate(report.generatedAt)}.
        </Text>

        <View style={styles.table}>
          <View style={styles.queryHeaderRow}>
            <View style={[styles.queryCell, styles.queryTextCol]}>
              <Text style={styles.smallHeader}>Query</Text>
            </View>
            <View style={[styles.queryCell, styles.providerCol]}>
              <Text style={styles.smallHeader}>Claude</Text>
            </View>
            <View style={[styles.queryCell, styles.providerCol]}>
              <Text style={styles.smallHeader}>ChatGPT</Text>
            </View>
          </View>

          {report.queryResults.map((row, index) => {
            const claude = providerStatus(row.claude);
            const chatgpt = providerStatus(row.chatgpt);

            return (
              <View
                key={`${row.query}-${index}`}
                style={index % 2 === 1 ? [styles.queryRow, styles.altRow] : styles.queryRow}
                wrap={false}
              >
                <View style={[styles.queryCell, styles.queryTextCol]}>
                  <Text style={styles.queryText}>{clip(row.query, 110)}</Text>
                </View>
                <View style={[styles.queryCell, styles.providerCol]}>
                  <Text style={[styles.statusPill, claude.style]}>{claude.label}</Text>
                  <Text style={styles.providerExcerpt}>{clip(claude.excerpt, 150)}</Text>
                </View>
                <View style={[styles.queryCell, styles.providerCol]}>
                  <Text style={[styles.statusPill, chatgpt.style]}>{chatgpt.label}</Text>
                  <Text style={styles.providerExcerpt}>{clip(chatgpt.excerpt, 150)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Page 4</Text>
        <Text style={styles.sectionTitle}>Competitive Gap Analysis</Text>

        <View style={styles.card}>
          <Text style={styles.sectionBody}>{report.gapAnalysis}</Text>
        </View>

        <View style={styles.twoCol}>
          <View style={[styles.card, styles.half]}>
            <Text style={styles.smallHeader}>Bing presence</Text>
            <Text style={[styles.title, { fontSize: 22, marginBottom: 6 }]}>
              {report.bingPageCount}
            </Text>
            <Text style={styles.bodySmall}>
              {report.bingIndexed
                ? `${report.domain} is indexed on Bing. This affects what ChatGPT can readily surface.`
                : "No meaningful Bing indexing detected during the audit run."}
            </Text>
          </View>
          <View style={[styles.card, styles.half]}>
            <Text style={styles.smallHeader}>Brave status</Text>
            <Text style={[styles.title, { fontSize: 22, marginBottom: 6 }]}>
              {report.braveIndexed ? "Indexed" : "Not indexed"}
            </Text>
            <Text style={styles.bodySmall}>
              {report.braveIndexed
                ? "Brave is seeing the domain, which improves the odds of Claude finding relevant pages."
                : "Brave did not surface the domain in the audit check, limiting discoverability for Claude-oriented experiences."}
            </Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Page 5</Text>
        <Text style={styles.sectionTitle}>Priority Fix Roadmap</Text>
        <Text style={styles.sectionBody}>
          Ranked by expected citation impact, not effort. These are the changes most likely to move
          the numbers on the previous pages.
        </Text>

        {fixes.map((fix, index) => (
          <View key={`${fix}-${index}`} style={styles.fixBlock}>
            <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
              {index + 1}. {fix}
            </Text>
            <Text style={styles.sectionBody}>
              Prioritize this because it addresses a repeatable loss pattern visible in the live
              query results and closes a structural or authority gap the competitors already cover.
            </Text>
          </View>
        ))}

        <View style={styles.footerBand}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            60-Day Projection
          </Text>
          <Text style={styles.sectionBody}>{report.projection}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Page 6</Text>
        <Text style={styles.sectionTitle}>Implementation Pack</Text>
        <Text style={styles.sectionBody}>
          Ready-to-paste schema templates adapted to {report.domain}. Use these on the matching
          page types so the roadmap turns into shipped structured data, not just advice.
        </Text>

        {report.schemaTemplates.slice(0, 3).map((template) => (
          <View key={template.id} style={styles.templateCard}>
            <Text style={{ fontSize: 11, fontWeight: 700 }}>{template.title}</Text>
            <Text style={[styles.bodySmall, { marginTop: 4 }]}>
              {template.filename} · {template.placement}
            </Text>
            <Text style={[styles.bodySmall, { marginTop: 5 }]}>{template.whyItMatters}</Text>
            <Text style={styles.templateCode}>{clipTemplateCode(template.code)}</Text>
          </View>
        ))}

        <View style={styles.footerBand}>
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Questions?</Text>
          <Text style={styles.sectionBody}>
            Email hello@aeospark.com and bring this implementation pack to the strategy call so
            engineering can ship the highest-impact schema first.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderScoreSummaryPdf(score: ScoreRecord) {
  return renderToBuffer(<ScoreSummaryDocument score={score} />);
}

export async function renderAuditPdf(audit: AuditRecord) {
  return renderToBuffer(<AuditDocument audit={audit} />);
}

export async function renderAuditDeliveryPdf(report: AuditReportData) {
  return renderToBuffer(<AuditDeliveryDocument report={report} />);
}
