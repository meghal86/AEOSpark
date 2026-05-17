import Link from "next/link";

import { AuthHeaderActions } from "@/components/auth-header-actions";
import { HomeIntakeForm } from "@/components/home-intake-form";
import { PurchasedHomeBanner } from "@/components/purchased-home-banner";

const GREEN = "#2D6A4F";
const RED = "#E24B4A";

const proofMetrics = [
  {
    value: "31/100",
    label: "Average AEO score across sites analyzed",
    accent: true,
  },
  {
    value: "89%",
    label: "Of B2B sites invisible to at least one AI platform",
  },
  {
    value: "<1%",
    label: "Overlap in ChatGPT and Perplexity citations for identical queries",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Paste your URL",
    detail: "No account, no setup. The scan starts the moment you submit.",
  },
  {
    step: "02",
    title: "See your visibility score",
    detail:
      "Seven AI-visibility signals scored against your competitors in under 60 seconds.",
  },
  {
    step: "03",
    title: "Fix what matters first",
    detail:
      "Upgrade to the full audit for prompt-level evidence and a 30/60/90-day roadmap.",
  },
];

type Badge = { label: string; tone: "you" | "competitor" | "none" };

const previewQueries: Array<{
  query: string;
  claude: Badge;
  chatgpt: Badge;
}> = [
  {
    query: "Best wallet security tool for DeFi teams",
    claude: { label: "CompX cited", tone: "competitor" },
    chatgpt: { label: "CompY cited", tone: "competitor" },
  },
  {
    query: "How do I prevent malicious wallet approvals?",
    claude: { label: "CompY cited", tone: "competitor" },
    chatgpt: { label: "CompX cited", tone: "competitor" },
  },
  {
    query: "What wallet protection tools do security teams trust?",
    claude: { label: "You cited", tone: "you" },
    chatgpt: { label: "CompX cited", tone: "competitor" },
  },
  {
    query: "Crypto wallet security for enterprise teams",
    claude: { label: "CompY cited", tone: "competitor" },
    chatgpt: { label: "You cited", tone: "you" },
  },
  {
    query: "Best DeFi security tool under $500/mo",
    claude: { label: "—", tone: "none" },
    chatgpt: { label: "CompX cited", tone: "competitor" },
  },
];

const citationShare = [
  { label: "Your brand", pct: 30, color: GREEN, pctColor: GREEN },
  { label: "Competitor A", pct: 60, color: RED, pctColor: RED },
  { label: "Competitor B", pct: 30, color: "var(--border-strong)", pctColor: "var(--foreground-muted)" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl">
      {/* ─────────────────────────────────────────────────────────────── */}
      {/*  Section 1 — Nav                                                 */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 md:px-8">
        <Link
          className="group inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-[var(--foreground)]"
          href="/"
        >
          <span
            className="h-2 w-2 rounded-full transition group-hover:scale-110"
            style={{ background: GREEN }}
          />
          AEOSpark
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            className="text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            href="#how"
          >
            How it works
          </Link>
          <Link
            className="text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            href="#proof"
          >
            Proof
          </Link>
          <AuthHeaderActions
            className="flex items-center gap-6"
            linkClassName="text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            buttonClassName="text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
          />
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--foreground)] px-4 text-sm font-medium text-white transition hover:bg-black"
            href="/checkout/audit"
          >
            Get full audit
          </Link>
        </div>

        {/* Mobile: simplified */}
        <Link
          className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--foreground)] px-3.5 text-sm font-medium text-white md:hidden"
          href="/checkout/audit"
        >
          Full audit
        </Link>
      </nav>

      <PurchasedHomeBanner />

      {/* ─────────────────────────────────────────────────────────────── */}
      {/*  Section 2 — Hero                                                */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="grid min-h-[460px] grid-cols-1 border-b border-[var(--border)] lg:grid-cols-2">
        {/* Left column — headline */}
        <div className="flex flex-col justify-center border-b border-[var(--border)] px-6 py-12 md:px-10 md:py-12 lg:border-b-0 lg:border-r">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
            Free AI visibility check
          </p>
          <h1 className="mb-4 text-[38px] font-medium leading-[1.1] tracking-[-0.02em] text-[var(--foreground)]">
            See what AI recommends
            <br />
            <em
              className="font-normal not-italic"
              style={{ color: GREEN, fontStyle: "italic" }}
            >
              instead of you.
            </em>
          </h1>
          <p className="max-w-[380px] text-sm leading-[1.7] text-[var(--foreground-muted)]">
            We benchmark your site across ChatGPT, Claude, Perplexity, and
            Gemini — scoring seven AI-visibility signals and surfacing the
            competitors winning buyer prompts in your category. Under a minute.
            No sign-up.
          </p>
        </div>

        {/* Right column — form */}
        <div
          id="intake"
          className="flex flex-col justify-center bg-[var(--surface-muted)] px-6 py-12 md:px-10"
        >
          <HomeIntakeForm />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/*  Section 3 — Proof strip                                         */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 border-b border-[var(--border)] md:grid-cols-3">
        {proofMetrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`px-8 py-6 ${
              index !== proofMetrics.length - 1
                ? "border-b border-[var(--border)] md:border-b-0 md:border-r"
                : ""
            }`}
          >
            <p
              className="text-[28px] font-medium leading-none tracking-[-0.02em]"
              style={{ color: metric.accent ? GREEN : "var(--foreground)" }}
            >
              {metric.value}
            </p>
            <p className="mt-3 text-xs text-[var(--foreground-muted)]">
              {metric.label}
            </p>
          </div>
        ))}
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/*  Section 4 — How it works                                         */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section
        id="how"
        className="border-b border-[var(--border)] px-6 py-14 md:px-10"
      >
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
          How it works
        </p>
        <h2 className="max-w-2xl text-[26px] font-medium tracking-[-0.02em] text-[var(--foreground)]">
          From invisible to measurably cited, in three steps.
        </h2>

        <div className="mt-10 grid grid-cols-1 border-t border-[var(--border)] md:grid-cols-3">
          {howItWorks.map((item, index) => (
            <div
              key={item.step}
              className={`px-6 py-8 ${
                index !== howItWorks.length - 1
                  ? "border-b border-[var(--border)] md:border-b-0 md:border-r"
                  : ""
              } ${index === 0 ? "md:pl-0" : ""} ${
                index === howItWorks.length - 1 ? "md:pr-0" : ""
              }`}
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
                {item.step}
              </p>
              <p className="mb-1.5 text-[15px] font-medium text-[var(--foreground)]">
                {item.title}
              </p>
              <p className="text-[13px] leading-[1.6] text-[var(--foreground-muted)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/*  Section 5 — Audit preview                                       */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section
        id="proof"
        className="border-b border-[var(--border)] px-6 py-14 md:px-10"
      >
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
          What the audit shows
        </p>
        <h2 className="max-w-3xl text-[26px] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--foreground)]">
          The prompts where buyers hear a competitor&rsquo;s name instead of yours.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-[1.7] text-[var(--foreground-muted)]">
          Redacted sample from a real delivered audit. The paid report lists
          every prompt, every competitor, and every citation-share gap — with
          fix priority.
        </p>

        <div className="mt-8 grid grid-cols-1 overflow-hidden rounded-xl border border-[var(--border)] lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left panel — citation share */}
          <div className="border-b border-[var(--border)] p-7 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
              Citation share · 40 model queries
            </p>

            <div className="mt-6 grid gap-0">
              {citationShare.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[100px_1fr_auto] items-center gap-3 py-2.5 ${
                    index !== citationShare.length - 1
                      ? "border-b border-[var(--border)]"
                      : ""
                  }`}
                >
                  <span className="text-[13px] text-[var(--foreground)]">
                    {row.label}
                  </span>
                  <div className="h-1 w-full overflow-hidden rounded-sm bg-[var(--surface-muted)]">
                    <div
                      className="h-full rounded-sm"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <span
                    className="text-[13px] font-medium tabular-nums"
                    style={{ color: row.pctColor }}
                  >
                    {row.pct}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <a
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2D6A4F] px-4 text-[13px] font-medium text-white transition hover:bg-[#225239]"
                href="/proof/sample-audit-report.html"
                rel="noreferrer"
                target="_blank"
              >
                Open sample audit
              </a>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-white px-4 text-[13px] font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)]"
                href="/checkout/audit"
              >
                Get full audit →
              </Link>
            </div>
          </div>

          {/* Right panel — query table */}
          <div>
            <div className="grid grid-cols-[1.5fr_0.75fr_0.75fr] border-b border-[var(--border)] bg-[var(--surface-muted)]">
              <div className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
                Buyer query
              </div>
              <div className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
                Claude
              </div>
              <div className="px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
                ChatGPT
              </div>
            </div>

            {previewQueries.map((row, index) => (
              <div
                key={row.query}
                className={`grid grid-cols-[1.5fr_0.75fr_0.75fr] items-center ${
                  index !== previewQueries.length - 1
                    ? "border-b border-[var(--border)]"
                    : ""
                }`}
              >
                <div className="px-3.5 py-2.5 text-[12px] leading-[1.5] text-[var(--foreground)]">
                  {row.query}
                </div>
                <div className="px-3.5 py-2.5">
                  <PreviewBadge badge={row.claude} />
                </div>
                <div className="px-3.5 py-2.5">
                  <PreviewBadge badge={row.chatgpt} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/*  Section 6 — Case study + guarantee                              */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 border-b border-[var(--border)] lg:grid-cols-2">
        {/* Left — pilot result */}
        <div className="border-b border-[var(--border)] px-6 py-14 md:px-10 lg:border-b-0 lg:border-r">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
            Pilot result
          </p>
          <h2 className="max-w-lg text-[26px] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--foreground)]">
            AlphaWhale moved from AI invisibility to measurable citation lift.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-[1.7] text-[var(--foreground-muted)]">
            AEOSpark identified the exact prompts where competitors were being
            cited, then prioritized direct-answer copy, comparison pages, and
            trust proof. The score improved. More importantly, the prompts
            where AI assistants mentioned the brand expanded measurably.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <MetricCard label="Before" value="12%" />
            <MetricCard label="After" value="34%" accent />
            <MetricCard label="Window" value="45d" />
          </div>

          <a
            className="mt-5 inline-flex text-[13px] font-medium transition hover:underline"
            href="/proof/alphawhale-case-study.html"
            rel="noreferrer"
            target="_blank"
            style={{ color: GREEN }}
          >
            Read case study →
          </a>
        </div>

        {/* Right — guarantee */}
        <div className="flex flex-col justify-center px-6 py-14 md:px-10">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-6">
            <p className="text-[13px] font-medium text-[var(--foreground)]">
              Audit guarantee
            </p>
            <p className="mt-2 text-[13px] leading-[1.65] text-[var(--foreground-muted)]">
              If you don&rsquo;t learn at least three specific, actionable ways
              to improve AI visibility from the paid audit, AEOSpark refunds
              the purchase in full. No forms, no questions.
            </p>
            <Link
              className="mt-3 inline-flex text-[13px] font-medium transition hover:underline"
              href="/checkout/audit"
              style={{ color: GREEN }}
            >
              Get the audit + 90-day measurement — $997 →
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/*  Section 7 — Bottom CTA                                          */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--border)] px-6 py-14 text-center md:px-10">
        <h2 className="mx-auto max-w-2xl text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--foreground)]">
          Ready to see who AI recommends instead of you?
        </h2>
        <p className="mx-auto mt-2.5 max-w-xl text-sm leading-[1.65] text-[var(--foreground-muted)]">
          Run the free score first. If the gap is meaningful, the full audit
          shows you exactly which prompts, which competitors, and what to fix.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2D6A4F] px-6 text-sm font-medium text-white transition hover:bg-[#225239]"
            href="#intake"
          >
            Run the free score
          </a>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border-strong)] bg-transparent px-6 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--foreground)]"
            href="/checkout/audit"
          >
            Get the audit + 90-day measurement — $997
          </Link>
        </div>
      </section>

      {/* Section 8 — Footer lives in src/app/layout.tsx (global, unchanged). */}
    </main>
  );
}

function PreviewBadge({ badge }: { badge: Badge }) {
  if (badge.tone === "none") {
    return (
      <span className="text-[12px] text-[var(--foreground-subtle)]">
        {badge.label}
      </span>
    );
  }

  const styles =
    badge.tone === "you"
      ? { background: "#EAF3DE", color: "#3B6D11" }
      : { background: "#FCEBEB", color: "#A32D2D" };

  return (
    <span
      className="inline-flex items-center rounded px-[7px] py-[3px] text-[11px] font-medium"
      style={styles}
    >
      {badge.label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
        {label}
      </p>
      <p
        className="mt-1.5 text-[24px] font-medium leading-none tracking-[-0.02em]"
        style={{ color: accent ? GREEN : "var(--foreground)" }}
      >
        {value}
      </p>
    </div>
  );
}
