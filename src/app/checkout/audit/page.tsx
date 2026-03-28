import { AuditCheckoutForm } from "@/components/audit-checkout-form";
import { FounderTrustCard } from "@/components/founder-trust-card";
import { PageUtilityNav } from "@/components/page-utility-nav";
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
  const reportPreview = [
    {
      title: "Section 1",
      heading: "Lost prompt map",
      detail:
        "A ranked list of high-intent AI prompts where your competitors are currently cited instead of you.",
    },
    {
      title: "Section 2",
      heading: "Competitor proof",
      detail:
        "Named competitor gaps, example AI responses, and the structural reasons they are being recommended first.",
    },
    {
      title: "Section 3",
      heading: "30/60/90-day roadmap",
      detail:
        "A concrete implementation sequence so the team knows what to publish, fix, and validate first.",
    },
  ];
  const proofStats = [
    { label: "Before", value: `${pilotProof.beforeCitationShare} citation share` },
    { label: "After", value: `${pilotProof.afterCitationShare} citation share` },
    { label: "Window", value: pilotProof.timeframe },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
      <PageUtilityNav />
      <section className="surface-panel app-fade-up grid gap-6 rounded-[2.4rem] p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="grid gap-4 self-start">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Full audit
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
            Get your AI visibility audit
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-700">
            Move from a score snapshot to an operator-grade report that shows
            where AI assistants recommend competitors instead of you, why that
            happens, and what to fix first.
          </p>
        </div>

        <div className="surface-card rounded-[2rem] p-6">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
            Audit package
          </p>
          <div className="mt-5 grid gap-3 text-sm text-stone-700">
            <p>$997 one-time payment</p>
            <p>Delivered within 24 hours</p>
            <p>PDF report, competitor analysis, and strategy call</p>
          </div>
        </div>
      </section>

      <section className="surface-panel grid gap-5 rounded-[2rem] p-6">
        <div className="grid gap-2">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            What arrives in the report
          </p>
          <h2 className="text-2xl font-semibold text-stone-950">
            A buying-grade deliverable, not a recycled score page.
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-stone-700">
            The paid audit is designed to answer the questions leadership
            actually asks: which prompts are we losing, which competitors are
            winning those prompts, and what specific changes should the team make
            in the next 90 days.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {reportPreview.map((item) => (
            <article className="surface-card rounded-[1.8rem] p-5" key={item.heading}>
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
                {item.title}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-stone-950">
                {item.heading}
              </h3>
              <p className="mt-3 text-sm leading-7 text-stone-700">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Sample deliverable
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">
            Review the shape of the audit before you pay.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
            The paid report opens with citation-share numbers and the exact prompts
            where AI assistants recommend competitors instead of you. It is built
            to answer a leadership question, not generate another dashboard screenshot.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Redacted sample based on the real audit structure.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {reportPreview.map((item) => (
              <div className="surface-card rounded-[1.7rem] p-5" key={item.heading}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {item.title}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-stone-950">{item.heading}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-700">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href="/proof/sample-audit-report.html"
              rel="noreferrer"
              target="_blank"
            >
              Open Sample Audit
            </a>
            <a
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href="/proof/citation-share-story.html"
              rel="noreferrer"
              target="_blank"
            >
              View Citation Story
            </a>
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-6">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Proof and founder
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-950">
            One real result and one accountable human behind the work.
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {proofStats.map((item) => (
              <div className="surface-card rounded-[1.7rem] p-5" key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-stone-950">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-stone-700">
            In the AlphaWhale case study, the work was not “add schema and hope.”
            It was identifying the prompts that mattered, tightening direct-answer
            pages, and improving trust proof where competitors were winning mentions.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Honest positioning: this is a pilot-style proof point, not a claim of broad historical scale.
          </p>
          <div className="mt-5">
            <FounderTrustCard compact />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href="/proof/alphawhale-case-study.html"
              rel="noreferrer"
              target="_blank"
            >
              Read Case Study
            </a>
          </div>
        </article>
      </section>

      <AuditCheckoutForm
        companyName={companyName}
        defaultEmail={email}
        defaultName={name}
        scoreId={scoreId}
        website={website}
      />
    </main>
  );
}
