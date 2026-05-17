import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getAuditByOrderId, getOrderById } from "@/lib/storage";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const [order, audit] = await Promise.all([
    getOrderById(orderId),
    getAuditByOrderId(orderId),
  ]);

  if (!order || !audit) {
    notFound();
  }

  const clientPct = audit.citationBaselinePct;
  const competitorPct = audit.competitorCitationPct;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader />

      {/* Masthead */}
      <section className="app-fade-up pt-16 pb-16 md:pt-24">
        <span className="ui-kicker">Audit report</span>
        <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
          {audit.companyName}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">
          {audit.executiveSummary}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            className="btn-accent inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
            href={`/api/audits/${audit.id}/report.pdf`}
          >
            Download PDF →
          </a>
          <Link
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-medium transition"
            href={`/monitor/${order.clientId}`}
          >
            Open client portal →
          </Link>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Citation share */}
      <section className="py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">01 · Citation share</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              You vs. the best competitor.
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-10">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                Your citation share
              </dt>
              <dd className="mt-3 font-display text-6xl tracking-tight text-[var(--accent)]">
                {clientPct}%
              </dd>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${Math.min(100, Math.max(0, clientPct))}%` }}
                />
              </div>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                Best competitor
              </dt>
              <dd className="mt-3 font-display text-6xl tracking-tight text-[var(--foreground)]">
                {competitorPct}%
              </dd>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-full bg-[var(--foreground-subtle)]"
                  style={{ width: `${Math.min(100, Math.max(0, competitorPct))}%` }}
                />
              </div>
            </div>
          </dl>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Priority fixes */}
      <section className="py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">02 · Priority fixes</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              Ship these first.
            </h2>
          </div>

          <div className="grid gap-0">
            {audit.topFixes.map((fix, index) => (
              <div
                key={fix.id}
                className="grid grid-cols-[auto_1fr] items-start gap-8 border-t border-[var(--border)] py-6 last:border-b"
              >
                <span className="font-display text-2xl tracking-tight text-[var(--foreground-subtle)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-base font-medium text-[var(--foreground)]">
                    {fix.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {fix.whyItMatters}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Roadmap */}
      <section className="py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">03 · 90-day roadmap</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              Phased rollout.
            </h2>
          </div>

          <div className="grid gap-0">
            {audit.roadmap.map((phase, index) => (
              <div
                key={phase.title}
                className="grid grid-cols-[auto_1fr] items-start gap-8 border-t border-[var(--border)] py-6 last:border-b"
              >
                <span className="font-display text-2xl tracking-tight text-[var(--foreground-subtle)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-base font-medium text-[var(--foreground)]">
                    {phase.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {phase.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Pages analyzed */}
      <section className="py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">04 · Pages analyzed</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              What we reviewed.
            </h2>
          </div>

          <ul className="grid gap-2 text-sm leading-relaxed text-[var(--foreground-muted)] md:grid-cols-2">
            {audit.pagesAnalyzed.map((page) => (
              <li
                key={page}
                className="border-t border-[var(--border)] py-2 first:border-t-0 md:first:border-t md:[&:nth-child(2)]:border-t"
              >
                {page}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
