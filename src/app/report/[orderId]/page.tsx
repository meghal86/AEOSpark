import { BuyerSessionSync } from "@/components/buyer-session-sync";
import Link from "next/link";

import { ReportAutoRefresh } from "@/components/report-auto-refresh";
import { SiteHeader } from "@/components/site-header";
import { getAuditDeliveryByReference } from "@/lib/audit-delivery";
import { appEnv } from "@/lib/env";
import { formatDate } from "@/lib/format";

function compactReference(value: string) {
  if (value.length <= 28) {
    return value;
  }

  return `${value.slice(0, 14)}...${value.slice(-8)}`;
}

function prettyStep(step?: string) {
  switch (step) {
    case "generate-queries":
      return "Generating buyer-intent queries";
    case "run-ai-queries":
      return "Running Claude and ChatGPT query tests";
    case "index-audit":
      return "Checking Bing and Brave visibility";
    case "generate-report-text":
      return "Writing the narrative report";
    case "generate-pdf":
      return "Assembling the PDF package";
    case "delivered":
      return "Report delivered";
    default:
      return "Preparing your report";
  }
}

function resultBadge(provider: {
  cited: boolean;
  competitor_cited: string | null;
} | null) {
  if (!provider) {
    return {
      label: "No response",
      className: "bg-stone-200 text-stone-700",
    };
  }

  if (provider.cited) {
    return {
      label: "Cited ✓",
      className: "bg-[#00C566] text-[#05351b]",
    };
  }

  if (provider.competitor_cited) {
    return {
      label: `× ${provider.competitor_cited}`,
      className: "bg-[#FF4D1C] text-white",
    };
  }

  return {
    label: "Not mentioned",
    className: "bg-stone-200 text-stone-700",
  };
}

function splitFixes(topFixes: string) {
  return topFixes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\).\s-]*/, ""))
    .slice(0, 5);
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const delivery = await getAuditDeliveryByReference(orderId);

  if (!delivery) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <SiteHeader />
        <section className="surface-panel rounded-[2.5rem] p-8">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
            Report unavailable
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
            Report not found.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
            Email hello@aeospark.com with your order reference and we&apos;ll help you locate the
            report.
          </p>
        </section>
      </main>
    );
  }

  const { order, report } = delivery;
  const reference = order.stripePaymentIntentId || order.id;

  if (order.status === "pending" || order.status === "processing" || !report) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <SiteHeader />
        <ReportAutoRefresh />

        <section className="surface-panel rounded-[2.5rem] p-8">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
            Report in progress
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
            Your report is being prepared.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
            We&apos;re still running the audit pipeline for {new URL(order.website).hostname.replace(/^www\./, "")}.
            This page refreshes automatically every 10 seconds.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="surface-card rounded-[1.8rem] p-5">
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
                Status
              </p>
              <p className="mt-3 text-lg font-semibold text-stone-950 capitalize">
                {order.status}
              </p>
            </article>
            <article className="surface-card rounded-[1.8rem] p-5">
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
                Current step
              </p>
              <p className="mt-3 text-lg font-semibold text-stone-950">
                {prettyStep(report?.auditStep)}
              </p>
            </article>
            <article className="surface-card rounded-[1.8rem] p-5">
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
                Estimated delivery
              </p>
              <p className="mt-3 text-lg font-semibold text-stone-950">Within 24 hours</p>
            </article>
          </div>

          <div className="mt-6 rounded-[1.8rem] border border-stone-200 bg-stone-50/80 px-5 py-4 text-sm leading-7 text-stone-600">
            Reference: <span className="font-semibold text-stone-950">{compactReference(reference)}</span>
          </div>
        </section>
      </main>
    );
  }

  const fixes = splitFixes(report.topFixes);
  const domain = report.domain;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-10">
      <BuyerSessionSync
        domain={domain}
        email={order.email}
        orderReference={reference}
        reportUrl={`/report/${reference}`}
        savedAt={new Date().toISOString()}
        status={order.status === "delivered" ? "delivered" : "processing"}
      />
      <SiteHeader />

      <section className="surface-panel grid gap-6 rounded-[2.5rem] p-6 lg:grid-cols-[240px_1fr] lg:p-8">
        <aside className="grid gap-4 self-start lg:sticky lg:top-8">
          <div className="surface-card rounded-[2rem] p-5">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
              Citation share
            </p>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-sm text-stone-600">Claude</p>
                <p className="text-3xl font-semibold text-stone-950">
                  {Math.round(report.claudeCitationShare)}%
                </p>
                <p className="text-sm text-stone-600">{report.claudeCited}/20 queries</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">ChatGPT</p>
                <p className="text-3xl font-semibold text-stone-950">
                  {Math.round(report.chatgptCitationShare)}%
                </p>
                <p className="text-sm text-stone-600">{report.chatgptCited}/20 queries</p>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-5">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
              Jump to
            </p>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-stone-700">
              <a href="#summary">Executive Summary</a>
              <a href="#queries">Query Results</a>
              <a href="#gaps">Gap Analysis</a>
              <a href="#roadmap">Fix Roadmap</a>
              <a href="#implementation">Implementation Pack</a>
            </div>
          </div>

          <div className="grid gap-3">
            <Link
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href={`/api/reports/${reference}/download`}
              target="_blank"
            >
              Download PDF
            </Link>
            <Link
              className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href={appEnv.calendlyUrl}
              target="_blank"
            >
              Book Strategy Call
            </Link>
          </div>
        </aside>

        <div className="grid gap-6">
          <section className="surface-card rounded-[2rem] p-6" id="summary">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
              Citation Share Summary
            </p>
            <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-stone-200">
              <div className="grid grid-cols-[1.6fr_1fr_1fr] border-b border-stone-200 bg-stone-50/90 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <div className="px-4 py-3">Brand</div>
                <div className="px-4 py-3">Claude</div>
                <div className="px-4 py-3">ChatGPT</div>
              </div>
              {[
                {
                  label: domain,
                  claude: `${Math.round(report.claudeCitationShare)}% (${report.claudeCited}/20)`,
                  chatgpt: `${Math.round(report.chatgptCitationShare)}% (${report.chatgptCited}/20)`,
                },
                {
                  label: report.competitor1 || "Top competitor",
                  claude: `${Math.round(report.competitor1ClaudeShare ?? report.competitor1Share)}%`,
                  chatgpt: `${Math.round(report.competitor1ChatgptShare ?? report.competitor1Share)}%`,
                },
                {
                  label: report.competitor2 || "Second competitor",
                  claude: `${Math.round(report.competitor2ClaudeShare ?? report.competitor2Share)}%`,
                  chatgpt: `${Math.round(report.competitor2ChatgptShare ?? report.competitor2Share)}%`,
                },
              ].map((row, index) => (
                <div
                  className={`grid grid-cols-[1.6fr_1fr_1fr] border-b border-stone-200 text-sm text-stone-700 ${index % 2 === 1 ? "bg-stone-50/60" : "bg-white/70"}`}
                  key={row.label}
                >
                  <div className="px-4 py-4 font-semibold text-stone-950">{row.label}</div>
                  <div className="px-4 py-4">{row.claude}</div>
                  <div className="px-4 py-4">{row.chatgpt}</div>
                </div>
              ))}
            </div>
            {report.marginOfError != null && report.marginOfError > 0 && (
              <div className="mt-4 rounded-[1.2rem] border border-stone-200 bg-stone-50/60 px-4 py-3 text-xs leading-6 text-stone-600">
                Score confidence: these numbers carry an estimated margin of error of
                {" "}±{report.marginOfError}% based on variance across {report.queryResults.length} queries.
                AI responses are non-deterministic — re-running may produce slightly different results.
              </div>
            )}
            <p className="mt-5 text-sm leading-7 text-stone-700">{report.executiveSummary}</p>
          </section>

          <section className="surface-card rounded-[2rem] p-6" id="queries">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
              Query Results
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              What AI says when your buyers ask
            </h2>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              20 real buyer-intent queries · results as of {formatDate(report.generatedAt)}
            </p>

            <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-stone-200">
              <div className="grid grid-cols-[1.35fr_1fr_1fr] border-b border-stone-200 bg-stone-50/90 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <div className="px-4 py-3">Query</div>
                <div className="px-4 py-3">Claude</div>
                <div className="px-4 py-3">ChatGPT</div>
              </div>
              {report.queryResults.map((row, index) => {
                const claude = resultBadge(row.claude);
                const chatgpt = resultBadge(row.chatgpt);

                return (
                  <div
                    className={`grid grid-cols-[1.35fr_1fr_1fr] gap-0 border-b border-stone-200 ${index % 2 === 1 ? "bg-stone-50/50" : "bg-white/80"}`}
                    key={`${row.query}-${index}`}
                  >
                    <div className="px-4 py-4 text-sm leading-6 text-stone-900">
                      {row.query.length > 60 ? `${row.query.slice(0, 60)}…` : row.query}
                    </div>
                    <div className="px-4 py-4">
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${claude.className}`}>
                        {claude.label}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-stone-600">
                        {row.claude?.excerpt || "No provider response captured."}
                      </p>
                    </div>
                    <div className="px-4 py-4">
                      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${chatgpt.className}`}>
                        {chatgpt.label}
                      </div>
                      <p className="mt-2 text-xs leading-5 text-stone-600">
                        {row.chatgpt?.excerpt || "No provider response captured."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="surface-card rounded-[2rem] p-6" id="gaps">
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
                Gap Analysis
              </p>
              <p className="mt-4 text-sm leading-7 text-stone-700">{report.gapAnalysis}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Bing indexed pages
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-stone-950">{report.bingPageCount}</p>
                </div>
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Brave status
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-stone-950">
                    {report.braveIndexed ? "Indexed" : "Not indexed"}
                  </p>
                </div>
              </div>
            </article>

            <article className="surface-card rounded-[2rem] p-6" id="roadmap">
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
                Fix Roadmap
              </p>
              <div className="mt-4 grid gap-3">
                {fixes.map((fix, index) => (
                  <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50/70 p-4" key={`${fix}-${index}`}>
                    <p className="text-sm font-semibold text-stone-950">
                      {index + 1}. {fix}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[1.5rem] border border-[rgba(72,52,40,0.12)] bg-[rgba(255,252,247,0.72)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  60-Day Projection
                </p>
                <p className="mt-3 text-sm leading-7 text-stone-700">{report.projection}</p>
              </div>
            </article>
          </section>

          <section className="surface-card rounded-[2rem] p-6" id="implementation">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
              Implementation Pack
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              Ready-to-paste schema templates
            </h2>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              These templates are prefilled for {domain}. Hand them to engineering with the fix
              roadmap so the audit turns into shipped structured data quickly.
            </p>

            <div className="mt-6 grid gap-5">
              {report.schemaTemplates.map((template) => (
                <article
                  className="rounded-[1.7rem] border border-stone-200 bg-stone-50/60 p-5"
                  key={template.id}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-stone-950">{template.title}</p>
                      <p className="text-sm text-stone-600">
                        {template.filename} · {template.placement}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-700">{template.whyItMatters}</p>
                  <pre className="mt-4 overflow-x-auto rounded-[1.3rem] border border-stone-200 bg-[#f7f0e7] p-4 text-xs leading-6 text-stone-800">
                    <code>{template.code}</code>
                  </pre>
                </article>
              ))}
            </div>
          </section>

          <div className="rounded-[1.7rem] border border-stone-200 bg-stone-50/80 px-5 py-4 text-sm text-stone-600">
            Generated on {formatDate(report.generatedAt)} · Order reference {compactReference(reference)}
          </div>
        </div>
      </section>
    </main>
  );
}
