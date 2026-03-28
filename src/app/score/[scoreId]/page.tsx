import Link from "next/link";
import { notFound } from "next/navigation";

import { EmailCaptureGate } from "@/components/email-capture-gate";
import { PageUtilityNav } from "@/components/page-utility-nav";
import { ShareScoreCard } from "@/components/share-score-card";
import { formatDate, percent, scoreGrade, scoreTone } from "@/lib/format";
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
  const grade = scoreGrade(score.overallScore);
  const weakestDimensions = [...score.dimensions]
    .sort(
      (left, right) =>
        left.score / Math.max(left.weight, 1) - right.score / Math.max(right.weight, 1),
    )
    .slice(0, 2)
    .map((dimension) => ({
      label: dimension.label,
      score: dimension.score,
    }));
  const nextMoveCopy =
    score.overallScore <= 35
      ? `Your score of ${score.overallScore} puts you in the bottom tier of sites we’ve analyzed. ChatGPT is likely recommending better-structured competitors in your category. The full audit shows which queries you’re losing and who is winning them.`
      : `Your score of ${score.overallScore} means AI assistants can partially parse the site, but you still have clear gaps competitors can beat you on. The full audit shows which queries matter most and where to fix them first.`;
  const auditPreview = [
    {
      title: "Prompt-level visibility",
      detail:
        "See the exact buyer-intent prompts where AI assistants mention competitors instead of you.",
    },
    {
      title: "Competitor evidence",
      detail:
        "Get named competitor examples, citation-share gaps, and where their pages beat yours structurally.",
    },
    {
      title: "Executive roadmap",
      detail:
        "Receive a ranked 30/60/90-day implementation plan instead of a generic list of suggestions.",
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 md:px-10">
      <PageUtilityNav />
      <section className="surface-panel app-fade-up grid gap-6 rounded-[2.4rem] p-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-stone-600">
              Created {formatDate(score.createdAt)}
            </span>
          </div>

          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
              {score.companyName} AEO score
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-700">
              {score.executiveSummary}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="surface-card rounded-3xl p-5">
              <p className={`text-sm font-semibold uppercase ${tone.className}`}>
                {tone.label}
              </p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-6xl font-semibold text-stone-950">{score.overallScore}</p>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${tone.className} bg-white/60`}>
                  {grade}
                </span>
              </div>
              <p className="mt-3 text-sm text-stone-700">{score.verdict}</p>
            </article>

            <article className="surface-card rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Crawl status
              </p>
              <p className="mt-3 text-xl font-semibold text-stone-950">
                {score.crawlStatus === "live" ? "Live" : "Estimated"}
              </p>
              <p className="mt-3 text-sm text-stone-700">{score.crawlNotes[0]}</p>
            </article>

            <article className="surface-card rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Next step
              </p>
              <p className="mt-3 text-xl font-semibold text-stone-950">
                What this score means
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-700">{nextMoveCopy}</p>
            </article>
          </div>
        </div>

        <div className="surface-card rounded-[2rem] p-5">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Primary URL
          </p>
          <p className="mt-3 break-all text-sm leading-6 text-stone-700">{score.url}</p>

          {score.comparison ? (
            <div className="mt-6 rounded-3xl border border-[rgba(72,52,40,0.1)] bg-[rgba(255,252,247,0.72)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Competitor comparison
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    {score.comparison.companyName}
                  </p>
                  <p className="break-all text-sm text-stone-600">{score.comparison.url}</p>
                </div>
                <p className="text-4xl font-semibold text-stone-950">
                  {score.comparison.overallScore}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-700">
                Citation gap vs primary:{" "}
                <span className="font-semibold text-stone-950">
                  {score.comparison.gapVsPrimary > 0 ? "+" : ""}
                  {score.comparison.gapVsPrimary}
                </span>
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            <Link
              className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl text-sm font-bold transition"
              href={`/checkout/audit?scoreId=${score.id}&website=${encodeURIComponent(
                score.url,
              )}&company=${encodeURIComponent(score.companyName)}`}
            >
              Get my full audit
            </Link>
            <Link
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
              href="/"
            >
              Run another score
            </Link>
            <a
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
              href={`/api/scores/${score.id}/summary.pdf`}
            >
              Download summary PDF
            </a>
          </div>
        </div>
      </section>

      <section className="surface-panel grid gap-5 rounded-[2rem] p-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            What changes in the paid audit
          </p>
          <h2 className="text-2xl font-semibold text-stone-950">
            This is where the score stops and the buying decision starts.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-stone-700">
            The free score tells you that visibility is weak. The audit shows
            which prompts matter, which competitors show up instead, what your
            pages are missing, and the order to fix everything.
          </p>
          <div className="rounded-[1.7rem] border border-[rgba(72,52,40,0.12)] bg-[rgba(255,252,247,0.72)] px-5 py-4 text-sm leading-7 text-stone-700">
            Teams do not pay for another dashboard. They pay for a clear answer
            to three questions: where are we losing, to whom, and what moves the
            needle first.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {auditPreview.map((item) => (
            <article className="surface-card rounded-[1.8rem] p-5" key={item.title}>
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
                {item.title}
              </p>
              <p className="mt-4 text-sm leading-7 text-stone-700">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-panel grid gap-4 rounded-[2rem] p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
              Score breakdown
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
              Seven signals, one uncomfortable number
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {score.dimensions.map((dimension) => {
            const value = Math.round((dimension.score / dimension.weight) * 100);
            const dimensionTone = scoreTone(value);
            const dimensionGrade = scoreGrade(value);

            return (
              <article
                className="surface-card rounded-3xl p-5 transition duration-200 hover:-translate-y-1"
                key={dimension.key}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      {dimension.label}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-stone-950">
                      {dimension.score}/{dimension.weight}
                    </h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${dimensionTone.className} bg-white/60`}>
                    {dimensionGrade}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${dimensionTone.barClassName}`}
                    style={{ width: percent(value) }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-stone-700">
                  {dimension.diagnosis}
                </p>
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

      <section className="flex flex-wrap gap-3">
        <Link
          className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
          href={`/score/public/${score.publicSlug}`}
        >
          Open public score URL
        </Link>
      </section>
    </main>
  );
}
