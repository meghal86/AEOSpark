import Link from "next/link";
import { notFound } from "next/navigation";

import { EmailCaptureGate } from "@/components/email-capture-gate";
import { ShareScoreCard } from "@/components/share-score-card";
import { formatDate, percent, scoreTone } from "@/lib/format";
import { getScoreById } from "@/lib/storage";

export default async function ScorePage({
  params,
}: {
  params: Promise<{ scoreId: string }>;
}) {
  const { scoreId } = await params;
  const score = await getScoreById(scoreId);

  if (!score) {
    notFound();
  }

  const tone = scoreTone(score.overallScore);
  const weakestDimensions = [...score.dimensions]
    .sort((left, right) => left.score - right.score)
    .slice(0, 2)
    .map((dimension) => ({
      label: dimension.label,
      score: dimension.score,
    }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 md:px-10">
      <section className="grid gap-6 rounded-[2.2rem] border border-white/10 bg-white/6 p-6 backdrop-blur lg:grid-cols-[1.3fr_0.7fr]">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
              Screen 2
            </span>
            <span className="text-sm text-slate-400">
              Created {formatDate(score.createdAt)}
            </span>
          </div>

          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {score.companyName} AEO score
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              {score.executiveSummary}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
              <p className={`text-sm font-semibold uppercase ${tone.className}`}>
                {tone.label}
              </p>
              <p className="mt-3 text-6xl font-semibold text-white">
                {score.overallScore}
              </p>
              <p className="mt-3 text-sm text-slate-300">{score.verdict}</p>
            </article>

            <article className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Crawl status
              </p>
              <p className="mt-3 text-xl font-semibold text-white">
                {score.crawlStatus === "live" ? "Live crawl" : "Fallback heuristic"}
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                {score.crawlNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Next step
              </p>
              <p className="mt-3 text-xl font-semibold text-white">
                Full audit or managed implementation
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                The free score is the wedge. The paid audit captures the citation
                baseline and turns fixes into a 90-day roadmap.
              </p>
            </article>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(14,26,44,0.8),rgba(8,17,31,0.45))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Primary URL
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{score.url}</p>

          {score.comparison ? (
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Competitor comparison
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {score.comparison.companyName}
                  </p>
                  <p className="text-sm text-slate-400">{score.comparison.url}</p>
                </div>
                <p className="text-4xl font-semibold text-white">
                  {score.comparison.overallScore}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Citation gap vs primary:{" "}
                <span className="font-semibold text-white">
                  {score.comparison.gapVsPrimary > 0 ? "+" : ""}
                  {score.comparison.gapVsPrimary}
                </span>
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
              href={`/checkout/audit?scoreId=${score.id}&website=${encodeURIComponent(
                score.url,
              )}&company=${encodeURIComponent(score.companyName)}`}
            >
              Get full $2,500 audit
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/12 px-4 text-sm font-semibold text-white transition hover:border-sky-300/50"
              href="/"
            >
              Run another score
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
              Score breakdown
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Six dimensions, one uncomfortable number
            </h2>
          </div>
          <p className="max-w-2xl text-sm text-slate-300">
            Each dimension maps to the FRD scoring model and explains why AI systems do
            or do not cite the site.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {score.dimensions.map((dimension) => {
            const value = Math.round((dimension.score / dimension.weight) * 100);
            const dimensionTone = scoreTone(value);

            return (
              <article
                className="rounded-3xl border border-white/10 bg-slate-950/55 p-5"
                key={dimension.key}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {dimension.label}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {dimension.score}/{dimension.weight}
                    </h3>
                  </div>
                  <span className={`text-sm font-semibold ${dimensionTone.className}`}>
                    {dimensionTone.label}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${dimensionTone.barClassName}`}
                    style={{ width: percent(value) }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {dimension.diagnosis}
                </p>

                <ul className="mt-4 grid gap-2 text-sm text-slate-400">
                  {dimension.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <EmailCaptureGate
        recommendations={score.recommendations}
        score={score.overallScore}
        scoreId={score.id}
        website={score.url}
      />

      <ShareScoreCard
        companyName={score.companyName}
        overallScore={score.overallScore}
        url={score.url}
        weakestDimensions={weakestDimensions}
      />
    </main>
  );
}
