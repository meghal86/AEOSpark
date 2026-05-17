import Link from "next/link";
import { notFound } from "next/navigation";

import { EmailCaptureGate } from "@/components/email-capture-gate";
import { ShareScoreCard } from "@/components/share-score-card";
import { SiteHeader } from "@/components/site-header";
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
      ? `A score of ${score.overallScore} is in the bottom tier of sites we've analyzed. AI assistants are likely recommending better-structured competitors in your category. The full audit shows which queries you're losing, and who's winning them.`
      : `A score of ${score.overallScore} means AI assistants can partially parse your site, but you still have clear gaps competitors beat you on. The full audit shows which queries matter most and where to fix them first.`;
  const auditPreview = [
    {
      title: "Prompt-level visibility",
      detail:
        "The exact buyer-intent prompts where AI assistants mention competitors instead of you.",
    },
    {
      title: "Competitor evidence",
      detail:
        "Named competitor examples, citation-share gaps, and where their pages beat yours structurally.",
    },
    {
      title: "Executive roadmap",
      detail:
        "A ranked 30/60/90-day implementation plan instead of a generic list of suggestions.",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  Headline                                                          */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="app-fade-up pt-16 pb-16 md:pt-24">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-subtle)]">
          <span className="ui-kicker">Visibility score</span>
          <span>·</span>
          <span>Created {formatDate(score.createdAt)}</span>
        </div>

        <h1 className="mt-6 text-5xl tracking-tight md:text-6xl">
          {score.companyName}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed">
          {score.executiveSummary}
        </p>

        {/* Big score + essentials */}
        <div className="mt-12 grid gap-12 border-t border-[var(--border)] pt-12 md:grid-cols-[0.7fr_1.3fr]">
          <div className="grid gap-3">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-[8rem] leading-none tracking-tighter text-[var(--foreground)]">
                {score.overallScore}
              </span>
              <span
                className={`font-display text-3xl tracking-tight ${tone.className}`}
              >
                {grade}
              </span>
            </div>
            <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${tone.className}`}>
              {tone.label}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{score.verdict}</p>
          </div>

          <div className="grid gap-6 self-start">
            <div className="grid gap-1 border-b border-[var(--border)] pb-5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                Primary URL
              </span>
              <p className="break-all text-base text-[var(--foreground)]">{score.url}</p>
            </div>

            <div className="grid gap-1 border-b border-[var(--border)] pb-5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                Crawl status
              </span>
              <p className="text-base text-[var(--foreground)]">
                {score.crawlStatus === "live" ? "Live crawl" : "Estimated"}
              </p>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                {score.crawlNotes[0]}
              </p>
            </div>

            <div className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                What this score means
              </span>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                {nextMoveCopy}
              </p>
            </div>

            {score.comparison ? (
              <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                  Competitor comparison
                </span>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {score.comparison.companyName}
                    </p>
                    <p className="break-all text-xs text-[var(--foreground-muted)]">
                      {score.comparison.url}
                    </p>
                  </div>
                  <p className="font-display text-4xl tracking-tight">
                    {score.comparison.overallScore}
                  </p>
                </div>
                <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                  Gap vs primary:{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {score.comparison.gapVsPrimary > 0 ? "+" : ""}
                    {score.comparison.gapVsPrimary}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-3">
              <Link
                className="btn-accent inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
              href={`/checkout/audit?scoreId=${score.id}&website=${encodeURIComponent(
                score.url,
              )}&company=${encodeURIComponent(score.companyName)}`}
            >
                Audit + 90 days of monthly re-measurement
              </Link>
              <Link
                className="btn-secondary inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
                href="/"
              >
                Run another score
              </Link>
              <a
                className="btn-ghost inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-3 text-sm font-medium transition"
                href={`/api/scores/${score.id}/summary.pdf`}
              >
                Download PDF →
              </a>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  Score breakdown — seven signals                                   */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="section-header">
          <span className="ui-kicker">Score breakdown</span>
          <h2 className="text-4xl md:text-5xl">Seven signals, one number.</h2>
          <p className="mt-2 text-base leading-relaxed">
            Each signal is weighted by how much it influences whether AI assistants
            can parse, trust, and cite your content. Focus on the weakest first.
          </p>
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-10 md:grid-cols-2">
          {score.dimensions.map((dimension) => {
            const value = Math.round((dimension.score / dimension.weight) * 100);
            const dimensionTone = scoreTone(value);

            return (
              <article
                className="grid gap-3 border-t border-[var(--border)] pt-6"
                key={dimension.key}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-medium tracking-tight text-[var(--foreground)]">
                    {dimension.label}
                  </h3>
                  <span className="font-display text-3xl tracking-tight">
                    {dimension.score}
                    <span className="text-base text-[var(--foreground-subtle)]">
                      /{dimension.weight}
                    </span>
                  </span>
                </div>

                <div className="h-[3px] overflow-hidden rounded-full bg-[var(--divider)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: percent(value),
                      background:
                        value >= 70
                          ? "var(--accent)"
                          : value >= 40
                            ? "var(--warning)"
                            : "var(--danger)",
                    }}
                  />
                </div>

                <p className="mt-1 text-sm leading-relaxed">
                  <span
                    className={`mr-2 text-xs font-semibold uppercase tracking-[0.12em] ${dimensionTone.className}`}
                  >
                    {dimensionTone.label}
                  </span>
                  {dimension.diagnosis}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <hr className="section-divider" />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  What comes in the paid audit                                      */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="section-header">
            <span className="ui-kicker">Beyond the score</span>
            <h2 className="text-4xl md:text-5xl">
              Where the buying decision starts.
            </h2>
            <p className="mt-2 text-base leading-relaxed">
              The score tells you visibility is weak. The audit tells you which
              prompts matter, which competitors show up instead, what your pages
              are missing, and the order to fix everything.
            </p>
          </div>

          <div className="grid gap-8">
            {auditPreview.map((item, index) => (
              <article
                className="grid grid-cols-[auto_1fr] gap-5 border-t border-[var(--border)] pt-6"
                key={item.title}
              >
                <span className="font-display text-2xl tracking-tight text-[var(--accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="grid gap-2">
                  <h3 className="text-xl font-medium text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  Email capture + share                                             */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <EmailCaptureGate
          recommendations={score.recommendations}
          score={score.overallScore}
          scoreId={score.id}
          website={score.url}
        />
      </section>

      <section className="py-16">
        <ShareScoreCard
          companyName={score.companyName}
          overallScore={score.overallScore}
          url={score.url}
          weakestDimensions={weakestDimensions}
        />
      </section>

      <section className="flex flex-wrap gap-3 pt-8 pb-20">
        <Link
          className="btn-ghost inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-medium transition"
          href={`/score/public/${score.publicSlug}`}
        >
          Open public score URL →
        </Link>
      </section>
    </main>
  );
}
