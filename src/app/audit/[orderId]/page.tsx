import Link from "next/link";
import { notFound } from "next/navigation";

import { PageUtilityNav } from "@/components/page-utility-nav";
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-10">
      <PageUtilityNav />
      <section className="surface-panel app-fade-up grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Audit report
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-stone-950 md:text-5xl">
            {audit.companyName}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
            {audit.executiveSummary}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="surface-card">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Client citation share
            </p>
            <p className="mt-3 text-5xl font-semibold text-stone-950">
              {audit.citationBaselinePct}%
            </p>
          </div>
          <div className="surface-card">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Best competitor
            </p>
            <p className="mt-3 text-5xl font-semibold text-stone-950">
              {audit.competitorCitationPct}%
            </p>
          </div>
          <div className="surface-card">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
              Delivery state
            </p>
            <p className="mt-3 text-lg font-semibold text-stone-950">Report ready</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <article className="surface-panel">
          <p className="ui-kicker text-xs uppercase tracking-[0.24em]">Priority fixes</p>
          <div className="mt-5 grid gap-3">
            {audit.topFixes.map((fix) => (
              <div
                className="surface-card"
                key={fix.id}
              >
                <p className="text-sm font-semibold text-stone-950">{fix.title}</p>
                <p className="mt-2 text-sm text-stone-700">{fix.whyItMatters}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel">
          <p className="ui-kicker text-xs uppercase tracking-[0.24em]">90-day roadmap</p>
          <div className="mt-5 grid gap-3">
            {audit.roadmap.map((phase) => (
              <div
                className="surface-card"
                key={phase.title}
              >
                <p className="text-sm font-semibold text-stone-950">{phase.title}</p>
                <p className="mt-2 text-sm text-stone-700">{phase.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-panel">
        <p className="ui-kicker text-xs uppercase tracking-[0.24em]">Pages analyzed</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {audit.pagesAnalyzed.map((page) => (
            <div
              className="surface-card text-sm text-stone-700"
              key={page}
            >
              {page}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <a
          className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold transition"
          href={`/api/audits/${audit.id}/report.pdf`}
        >
          Download PDF
        </a>
        <Link
          className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
          href={`/monitor/${order.clientId}`}
        >
          Open client portal
        </Link>
      </section>
    </main>
  );
}
