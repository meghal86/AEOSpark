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

type ProviderResult = {
  cited: boolean;
  competitor_cited: string | null;
  excerpt?: string;
} | null;

function resultState(provider: ProviderResult): {
  label: string;
  tone: "accent" | "muted" | "danger";
} {
  if (!provider) {
    return { label: "No response", tone: "muted" };
  }

  if (provider.cited) {
    return { label: "Cited ✓", tone: "accent" };
  }

  if (provider.competitor_cited) {
    return { label: provider.competitor_cited, tone: "danger" };
  }

  return { label: "Not mentioned", tone: "muted" };
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
      <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
        <SiteHeader />
        <section className="app-fade-up pt-16 pb-24 md:pt-24">
          <span className="ui-kicker">Report unavailable</span>
          <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
            Report not found.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed">
            Email{" "}
            <a
              className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
              href="mailto:hello@aeospark.com"
            >
              hello@aeospark.com
            </a>{" "}
            with your order reference and we&rsquo;ll help you locate it.
          </p>
        </section>
      </main>
    );
  }

  const { order, report } = delivery;
  const reference = order.stripePaymentIntentId || order.id;

  if (order.status === "pending" || order.status === "processing" || !report) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
        <SiteHeader />
        <ReportAutoRefresh />

        <section className="app-fade-up pt-16 pb-24 md:pt-24">
          <span className="ui-kicker">Report in progress</span>
          <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
            Your report is being prepared.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed">
            We&rsquo;re still running the audit pipeline for{" "}
            <span className="font-medium text-[var(--foreground)]">
              {new URL(order.website).hostname.replace(/^www\./, "")}
            </span>
            . This page refreshes automatically every 10 seconds.
          </p>

          <dl className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            <StatusCell label="Status" value={order.status.charAt(0).toUpperCase() + order.status.slice(1)} />
            <StatusCell label="Current step" value={prettyStep(report?.auditStep)} />
            <StatusCell label="Delivery" value="Within 24 hrs" />
          </dl>

          <p className="mt-12 text-sm text-[var(--foreground-muted)]">
            Reference:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {compactReference(reference)}
            </span>
          </p>
        </section>
      </main>
    );
  }

  const fixes = splitFixes(report.topFixes);
  const domain = report.domain;
  const claudePct = Math.round(report.claudeCitationShare);
  const chatgptPct = Math.round(report.chatgptCitationShare);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-6 md:px-10 md:py-10">
      <BuyerSessionSync
        domain={domain}
        email={order.email}
        orderReference={reference}
        reportUrl={`/report/${reference}`}
        savedAt={new Date().toISOString()}
        status={order.status === "delivered" ? "delivered" : "processing"}
      />
      <SiteHeader />

      {/* -------------------------------------------------------------- */}
      {/*  Masthead                                                       */}
      {/* -------------------------------------------------------------- */}
      <section className="app-fade-up pt-16 pb-16 md:pt-24">
        <div className="flex flex-wrap items-center gap-3">
          <span className="ui-kicker">AI visibility audit</span>
          <span className="text-xs text-[var(--foreground-subtle)]">
            · {formatDate(report.generatedAt)}
          </span>
        </div>
        <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
          {domain}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">
          A prompt-level view of how Claude and ChatGPT cite you versus the two
          competitors your buyers compare you against.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
            href={`/api/reports/${reference}/download`}
            target="_blank"
          >
            Download PDF →
          </Link>
          {appEnv.calendlyUrl ? (
            <Link
              className="btn-accent inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
              href={appEnv.calendlyUrl}
              target="_blank"
            >
              Book strategy call →
            </Link>
          ) : null}
        </div>
      </section>

      <hr className="section-divider" />

      {/* -------------------------------------------------------------- */}
      {/*  Citation share (headline metric)                              */}
      {/* -------------------------------------------------------------- */}
      <section className="py-16 md:py-20" id="summary">
        <div className="grid gap-12 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">01 · Citation share</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              Where AI points your buyers.
            </h2>
            <p className="mt-4 text-sm leading-relaxed">
              Share of 20 buyer-intent prompts where each brand was cited as a
              recommended answer.
            </p>
            {report.marginOfError != null && report.marginOfError > 0 ? (
              <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">
                Margin of error: ±{report.marginOfError}%. AI responses are
                non-deterministic; re-running may vary.
              </p>
            ) : null}
          </div>

          <div>
            <ShareRow
              brand={domain}
              you
              claude={{ pct: claudePct, label: `${report.claudeCited}/20` }}
              chatgpt={{ pct: chatgptPct, label: `${report.chatgptCited}/20` }}
            />
            <ShareRow
              brand={report.competitor1 || "Top competitor"}
              claude={{
                pct: Math.round(report.competitor1ClaudeShare ?? report.competitor1Share),
              }}
              chatgpt={{
                pct: Math.round(report.competitor1ChatgptShare ?? report.competitor1Share),
              }}
            />
            <ShareRow
              brand={report.competitor2 || "Second competitor"}
              claude={{
                pct: Math.round(report.competitor2ClaudeShare ?? report.competitor2Share),
              }}
              chatgpt={{
                pct: Math.round(report.competitor2ChatgptShare ?? report.competitor2Share),
              }}
            />
          </div>
        </div>

        <div className="mt-12 max-w-3xl text-base leading-relaxed text-[var(--foreground)]">
          {report.executiveSummary}
        </div>
      </section>

      <hr className="section-divider" />

      {/* -------------------------------------------------------------- */}
      {/*  Query-level results                                           */}
      {/* -------------------------------------------------------------- */}
      <section className="py-16 md:py-20" id="queries">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">02 · Query results</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              What AI says when your buyers ask.
            </h2>
            <p className="mt-4 text-sm leading-relaxed">
              Exactly what Claude and ChatGPT said when real buyer-intent
              queries were tested.
            </p>
          </div>

          <div className="grid gap-0">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-6 border-b border-[var(--border-strong)] py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              <span>Query</span>
              <span>Claude</span>
              <span>ChatGPT</span>
            </div>

            {report.queryResults.map((row, index) => {
              const claude = resultState(row.claude);
              const chatgpt = resultState(row.chatgpt);

              return (
                <div
                  key={`${row.query}-${index}`}
                  className="grid grid-cols-[1.4fr_1fr_1fr] gap-6 border-b border-[var(--border)] py-5"
                >
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">
                    {row.query.length > 72 ? `${row.query.slice(0, 72)}…` : row.query}
                  </p>

                  <div>
                    <ResultPill state={claude} />
                    <p className="mt-2 text-xs leading-5 text-[var(--foreground-muted)]">
                      {row.claude?.excerpt || "—"}
                    </p>
                  </div>
                  <div>
                    <ResultPill state={chatgpt} />
                    <p className="mt-2 text-xs leading-5 text-[var(--foreground-muted)]">
                      {row.chatgpt?.excerpt || "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* -------------------------------------------------------------- */}
      {/*  Gap analysis                                                  */}
      {/* -------------------------------------------------------------- */}
      <section className="py-16 md:py-20" id="gaps">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">03 · Gap analysis</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              Why you&rsquo;re missing.
            </h2>
          </div>

          <div>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--foreground)]">
              {report.gapAnalysis}
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-10 md:max-w-lg">
              <StatusCell label="Bing indexed pages" value={String(report.bingPageCount)} />
              <StatusCell label="Brave status" value={report.braveIndexed ? "Indexed" : "Not indexed"} />
            </dl>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* -------------------------------------------------------------- */}
      {/*  Fix roadmap                                                    */}
      {/* -------------------------------------------------------------- */}
      <section className="py-16 md:py-20" id="roadmap">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">04 · Fix roadmap</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              Ship these, in order.
            </h2>
            <p className="mt-4 text-sm leading-relaxed">
              Ranked by leverage. Start at the top — each fix compounds the
              next.
            </p>
          </div>

          <div>
            <div className="grid gap-0">
              {fixes.map((fix, index) => (
                <div
                  key={`${fix}-${index}`}
                  className="grid grid-cols-[auto_1fr] items-start gap-8 border-t border-[var(--border)] py-6 last:border-b"
                >
                  <span className="font-display text-2xl tracking-tight text-[var(--foreground-subtle)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base leading-relaxed text-[var(--foreground)]">
                    {fix}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[var(--radius-md)] border border-[var(--accent)]/25 bg-[var(--accent-soft)] p-6">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-deep)]">
                60-day projection
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[var(--accent-deep)]">
                {report.projection}
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* -------------------------------------------------------------- */}
      {/*  Implementation pack                                            */}
      {/* -------------------------------------------------------------- */}
      <section className="py-16 md:py-20" id="implementation">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">05 · Implementation pack</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              Ready-to-paste schema.
            </h2>
            <p className="mt-4 text-sm leading-relaxed">
              Prefilled for {domain}. Hand to engineering with the roadmap.
            </p>
          </div>

          <div className="grid gap-10">
            {(report.schemaTemplates ?? []).map((template) => (
              <article key={template.id} className="grid gap-4">
                <div>
                  <p className="text-lg font-medium text-[var(--foreground)]">
                    {template.title}
                  </p>
                  <p className="text-xs text-[var(--foreground-subtle)]">
                    {template.filename} · {template.placement}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {template.whyItMatters}
                </p>
                <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-5 text-xs leading-6 text-[var(--foreground)]">
                  <code>{template.code}</code>
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      <section className="py-10 text-sm text-[var(--foreground-muted)]">
        Generated on {formatDate(report.generatedAt)} · Order reference{" "}
        <span className="font-medium text-[var(--foreground)]">
          {compactReference(reference)}
        </span>
      </section>
    </main>
  );
}

function StatusCell(props: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
        {props.label}
      </dt>
      <dd className="mt-2 font-display text-3xl tracking-tight text-[var(--foreground)]">
        {props.value}
      </dd>
    </div>
  );
}

function ShareRow(props: {
  brand: string;
  you?: boolean;
  claude: { pct: number; label?: string };
  chatgpt: { pct: number; label?: string };
}) {
  return (
    <div className="grid gap-3 border-t border-[var(--border)] py-5 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-4">
        <p
          className={`text-base ${
            props.you
              ? "font-semibold text-[var(--foreground)]"
              : "font-medium text-[var(--foreground-muted)]"
          }`}
        >
          {props.brand}
          {props.you ? (
            <span className="ml-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              You
            </span>
          ) : null}
        </p>
      </div>

      <ShareBar
        label="Claude"
        pct={props.claude.pct}
        detail={props.claude.label}
        you={props.you}
      />
      <ShareBar
        label="ChatGPT"
        pct={props.chatgpt.pct}
        detail={props.chatgpt.label}
        you={props.you}
      />
    </div>
  );
}

function ShareBar(props: {
  label: string;
  pct: number;
  detail?: string;
  you?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, props.pct));
  return (
    <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4">
      <span className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--foreground-subtle)]">
        {props.label}
      </span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          className={`h-full rounded-full ${
            props.you ? "bg-[var(--accent)]" : "bg-[var(--foreground-subtle)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--foreground)]">
        {pct}%{props.detail ? ` · ${props.detail}` : ""}
      </span>
    </div>
  );
}

function ResultPill(props: {
  state: { label: string; tone: "accent" | "muted" | "danger" };
}) {
  const toneClass =
    props.state.tone === "accent"
      ? "border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--accent-deep)]"
      : props.state.tone === "danger"
        ? "border-[var(--danger)]/25 bg-[rgba(154,58,47,0.06)] text-[var(--danger)]"
        : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground-muted)]";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}
    >
      {props.state.label}
    </span>
  );
}
