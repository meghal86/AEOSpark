import { AuditCheckoutForm } from "@/components/audit-checkout-form";
import { FounderTrustCard } from "@/components/founder-trust-card";
import { SiteHeader } from "@/components/site-header";
import { pilotProof } from "@/lib/site-proof";

function decodeValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const companyName = decodeValue(resolved.company);
  const website = decodeValue(resolved.website);
  const scoreId = decodeValue(resolved.scoreId);
  const email = decodeValue(resolved.email);
  const name = decodeValue(resolved.name);
  const reportSections = [
    {
      heading: "Lost prompt map",
      detail:
        "A ranked list of high-intent AI prompts where competitors are cited instead of you.",
    },
    {
      heading: "Competitor proof",
      detail:
        "Named competitor gaps, example AI responses, and the structural reasons they win.",
    },
    {
      heading: "30/60/90-day roadmap",
      detail:
        "A concrete implementation sequence — what to publish, fix, and validate first.",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  Headline                                                          */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="app-fade-up pt-16 pb-12 md:pt-24">
        <span className="ui-kicker">Full audit</span>
        <h1 className="mt-4 max-w-4xl text-5xl tracking-tight md:text-6xl">
          Get your AI visibility audit.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed">
          Move from a score snapshot to an operator-grade report: the exact
          prompts where AI recommends competitors instead of you, why, and
          what to fix first.
        </p>

        <dl className="mt-10 grid max-w-3xl grid-cols-1 gap-8 border-t border-[var(--border)] pt-8 md:grid-cols-3">
          <div className="grid gap-1">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              Investment
            </dt>
            <dd className="font-display text-3xl tracking-tight text-[var(--foreground)]">
              $997
            </dd>
            <dd className="text-sm text-[var(--foreground-muted)]">One-time payment</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              Delivery
            </dt>
            <dd className="font-display text-3xl tracking-tight text-[var(--foreground)]">
              24 hrs
            </dd>
            <dd className="text-sm text-[var(--foreground-muted)]">After checkout</dd>
          </div>
          <div className="grid gap-1">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              Format
            </dt>
            <dd className="font-display text-3xl tracking-tight text-[var(--foreground)]">
              PDF + tracking
            </dd>
            <dd className="text-sm text-[var(--foreground-muted)]">
              90-day measurement window
            </dd>
          </div>
        </dl>
      </section>

      <hr className="section-divider" />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  What's in the report                                              */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="section-header">
          <span className="ui-kicker">Inside the report</span>
          <h2 className="text-4xl md:text-5xl">
            A buying-grade deliverable, not a recycled score page.
          </h2>
          <p className="mt-2 text-base leading-relaxed">
            Built to answer the three questions leadership actually asks: which
            prompts are we losing, which competitors are winning them, and what
            do we ship in the next 90 days.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {reportSections.map((item, index) => (
            <article key={item.heading} className="grid gap-3">
              <span className="font-display text-3xl tracking-tight text-[var(--accent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-medium text-[var(--foreground)]">
                {item.heading}
              </h3>
              <p className="text-base leading-relaxed">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <a
            className="btn-ghost inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition"
            href="/proof/sample-audit-report.html"
            rel="noreferrer"
            target="_blank"
          >
            Open sample audit →
          </a>
          <a
            className="btn-ghost inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-4 text-sm font-semibold transition"
            href="/proof/citation-share-story.html"
            rel="noreferrer"
            target="_blank"
          >
            View citation story →
          </a>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  Proof + founder                                                   */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="grid gap-6">
            <span className="ui-kicker">Proof point</span>
            <h2 className="text-4xl md:text-5xl">
              One real result behind the work.
            </h2>
            <p className="text-base leading-relaxed">
              In the AlphaWhale case study, the work was not &ldquo;add schema and hope.&rdquo;
              It was identifying the prompts that mattered, tightening direct-answer
              pages, and improving trust proof where competitors were winning mentions.
            </p>

            <dl className="mt-2 grid grid-cols-3 gap-6 border-t border-[var(--border)] pt-8">
              <div className="grid gap-1">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                  Before
                </dt>
                <dd className="font-display text-2xl tracking-tight text-[var(--foreground)]">
                  {pilotProof.beforeCitationShare}
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                  After
                </dt>
                <dd className="font-display text-2xl tracking-tight text-[var(--accent)]">
                  {pilotProof.afterCitationShare}
                </dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                  Window
                </dt>
                <dd className="font-display text-2xl tracking-tight text-[var(--foreground)]">
                  {pilotProof.timeframe}
                </dd>
              </div>
            </dl>

            <p className="text-xs text-[var(--foreground-subtle)]">
              Honest positioning: a pilot-style proof point, not a claim of broad historical scale.
            </p>

            <div>
              <a
                className="btn-ghost inline-flex h-11 items-center rounded-[var(--radius-md)] px-4 text-sm font-semibold transition"
                href="/proof/alphawhale-case-study.html"
                rel="noreferrer"
                target="_blank"
              >
                Read case study →
              </a>
            </div>
          </div>

          <div className="self-start">
            <FounderTrustCard compact />
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/*  Checkout form                                                     */}
      {/* ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <AuditCheckoutForm
          companyName={companyName}
          defaultEmail={email}
          defaultName={name}
          scoreId={scoreId}
          website={website}
        />
      </section>
    </main>
  );
}
