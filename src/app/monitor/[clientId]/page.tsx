import Link from "next/link";
import { notFound } from "next/navigation";

import { percent } from "@/lib/format";
import { getClientById } from "@/lib/storage";

export default async function MonitorPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClientById(clientId);

  if (!client) {
    notFound();
  }

  const trendMax = Math.max(
    ...client.trend.map((point) =>
      Math.max(point.citationShare, point.competitorShare),
    ),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 md:px-10">
      <section className="grid gap-5 rounded-[2.2rem] border border-white/10 bg-white/6 p-6 backdrop-blur lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Phase 4 / Client portal
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {client.companyName} citation monitor
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            {client.dashboardHeadline}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Plan / portal
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <p>
              <span className="font-semibold text-white">Plan:</span> {client.plan}
            </p>
            <p>
              <span className="font-semibold text-white">Tracked queries:</span>{" "}
              {client.trackedQueries}
            </p>
            <p>
              <span className="font-semibold text-white">Website:</span>{" "}
              {client.website}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Baseline citation share
          </p>
          <p className="mt-3 text-5xl font-semibold text-white">
            {client.baselineCitationShare}%
          </p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Current citation share
          </p>
          <p className="mt-3 text-5xl font-semibold text-white">
            {client.currentCitationShare}%
          </p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Citation gap to leader
          </p>
          <p className="mt-3 text-5xl font-semibold text-white">
            {client.citationGap} pts
          </p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                Trend tracking
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                60-day citation-share trend
              </h2>
            </div>
            <p className="text-sm text-slate-400">Client vs best competitor</p>
          </div>

          <div className="mt-6 grid gap-4">
            {client.trend.map((point) => (
              <div className="grid gap-2" key={point.label}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white">{point.label}</span>
                  <span className="text-slate-400">
                    {point.citationShare}% / {point.competitorShare}%
                  </span>
                </div>

                <div className="grid gap-2">
                  <div className="h-3 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
                      style={{
                        width: percent(
                          Math.round((point.citationShare / trendMax) * 100),
                        ),
                      }}
                    />
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-300"
                      style={{
                        width: percent(
                          Math.round((point.competitorShare / trendMax) * 100),
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            API key readiness
          </p>
          <div className="mt-5 grid gap-3">
            {client.apiKeyStatus.map((provider) => (
              <div
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3"
                key={provider.provider}
              >
                <span className="text-sm font-semibold text-white">
                  {provider.provider}
                </span>
                <span
                  className={`text-sm ${
                    provider.connected ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {provider.connected ? "Connected" : "Needs BYOK"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/55 p-4 text-sm leading-6 text-slate-300">
            The FRD requires official APIs only. The portal models that by showing
            provider readiness rather than scraping consumer chat UIs.
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Monthly priorities
          </p>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
            {client.priorities.map((priority) => (
              <li
                className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3"
                key={priority}
              >
                {priority}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Delivery cadence
          </p>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-300">
            {client.monthlyDeliverables.map((deliverable) => (
              <li
                className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3"
                key={deliverable}
              >
                {deliverable}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
          href="/"
        >
          Run another score
        </Link>
        <Link
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 px-5 text-sm font-semibold text-white transition hover:border-sky-300/50"
          href="https://calendly.com"
          rel="noreferrer"
          target="_blank"
        >
          Book monthly strategy call
        </Link>
      </section>
    </main>
  );
}
