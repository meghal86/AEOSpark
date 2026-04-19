import { PurchasedHomeBanner } from "@/components/purchased-home-banner";
import { UrlIntakeForm } from "@/components/url-intake-form";
import { FounderTrustCard } from "@/components/founder-trust-card";
import { AuthHeaderActions } from "@/components/auth-header-actions";
import { pilotProof } from "@/lib/site-proof";

const howItWorks = [
  {
    name: "Step 1",
    title: "Enter URL",
    detail: "Paste any company site. No account required and no setup before the scan starts.",
  },
  {
    name: "Step 2",
    title: "Get Score",
    detail: "See seven visibility signals, diagnoses, and the first three fixes worth shipping now.",
  },
  {
    name: "Step 3",
    title: "We Fix It",
    detail: "Upgrade to the audit and implementation path when the score exposes real upside.",
  },
];

const signals = [
  {
    title: "AI assistants recommend whoever they can parse fastest",
    body: "If your pricing, structure, and trust signals are weak, competitors get cited before you.",
  },
  {
    title: "ChatGPT visibility is not the same thing as Google SEO",
    body: "Bing, crawl access, and machine-readable content can decide whether you show up at all.",
  },
  {
    title: "The expensive part is not being absent from buyer prompts",
    body: "The score shows where you are weak. The audit shows the prompts, competitors, and fixes that matter.",
  },
];

const statsStrip = [
  "Free score in under 60 seconds",
  "Competitor gap visible in one pass",
  "Prompt-by-prompt findings in the audit",
  "24-hour report delivery for paid audits",
];

const sampleQueries = [
  {
    query: "Best wallet security tool for DeFi teams",
    claude: "CompetitorX cited instead",
    chatgpt: "AlphaWhale cited",
    claudeTone: "text-orange-700 bg-orange-50",
    chatgptTone: "text-emerald-700 bg-emerald-50",
  },
  {
    query: "How do I prevent malicious wallet approvals?",
    claude: "CompetitorY cited instead",
    chatgpt: "CompetitorX cited instead",
    claudeTone: "text-orange-700 bg-orange-50",
    chatgptTone: "text-orange-700 bg-orange-50",
  },
  {
    query: "What wallet protection tools do security teams trust?",
    claude: "AlphaWhale cited",
    chatgpt: "CompetitorX cited instead",
    claudeTone: "text-emerald-700 bg-emerald-50",
    chatgptTone: "text-orange-700 bg-orange-50",
  },
];

const caseStudyStats = [
  { label: "Before", value: `${pilotProof.beforeCitationShare} citation share` },
  { label: "After", value: `${pilotProof.afterCitationShare} citation share` },
  { label: "Window", value: pilotProof.timeframe },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-6 py-8 md:px-10 md:py-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="ui-chip inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            AEOSpark
          </div>
          <div className="hidden items-center gap-5 md:flex">
            <a
              className="text-sm font-semibold text-stone-700 transition hover:text-stone-950"
              href="#platform"
            >
              How it works
            </a>
            <a
              className="text-sm font-semibold text-stone-700 transition hover:text-stone-950"
              href="#signals"
            >
              Signals
            </a>
            <a
              className="text-sm font-semibold text-stone-700 transition hover:text-stone-950"
              href="#proof"
            >
              Proof
            </a>
            <a
              className="btn-primary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold transition"
              href="/checkout/audit"
            >
              Get Full Audit
            </a>
            <AuthHeaderActions className="flex items-center gap-3" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 md:hidden">
          <a
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            href="#platform"
          >
            How it works
          </a>
          <a
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            href="#signals"
          >
            Signals
          </a>
          <a
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            href="#proof"
          >
            Proof
          </a>
          <a
            className="btn-primary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold transition"
            href="/checkout/audit"
          >
            Get Full Audit
          </a>
          <AuthHeaderActions
            buttonClassName="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            className="contents"
            linkClassName="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
          />
        </div>

        <section className="surface-panel app-fade-up relative overflow-hidden rounded-[2.8rem] px-6 py-8 md:px-10 md:py-12">
          <div className="absolute inset-y-0 right-0 hidden w-[30rem] bg-[radial-gradient(circle_at_center,_rgba(168,124,92,0.12),_transparent_68%)] blur-2xl lg:block" />
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative z-10 grid gap-7">
              <div className="ui-chip ui-kicker inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                Free AI Visibility Check
              </div>

              <div>
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-stone-950 md:text-7xl md:leading-[0.95]">
                  See what ChatGPT recommends instead of you.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-stone-700 md:text-lg">
                  Paste your URL and a competitor URL to see where AI assistants
                  recommend them over you. Get your score in under a minute. No
                  sign-up required.
                </p>
              </div>
            </div>

            <div className="relative z-10 self-end" id="intake">
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="ui-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
                  Live score
                </div>
                <div className="ui-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
                  See competitor gap
                </div>
              </div>
              <UrlIntakeForm />
              <p className="mt-4 text-sm text-stone-700">
                Free forever · No account needed · Results in 60 seconds
              </p>
            </div>
          </div>
        </section>
      </header>

      <PurchasedHomeBanner />

      <section className="surface-card grid gap-4 rounded-[2rem] p-5" id="signals">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
          By the numbers
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statsStrip.map((item) => (
            <div className="ui-chip rounded-2xl px-4 py-4 text-sm font-semibold" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section
        className="surface-panel grid gap-6 rounded-[2.4rem] p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr]"
        id="proof"
      >
        <div className="grid gap-4">
          <div>
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
              Redacted sample audit
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
              Buyers pay for the exact prompts where AI recommends competitors instead of them.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
              The free score tells you whether your site is weak. The paid audit
              shows the buyer-intent prompts, the competitor mentions, and the
              citation-share gap that leadership can act on immediately.
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Based on the structure of a real delivered audit, with sensitive details removed.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="surface-card rounded-[1.8rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Your brand
              </p>
              <p className="mt-3 text-3xl font-semibold text-stone-950">30%</p>
              <p className="mt-2 text-sm text-stone-700">12 of 40 total model citations</p>
            </article>
            <article className="surface-card rounded-[1.8rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Competitor A
              </p>
              <p className="mt-3 text-3xl font-semibold text-stone-950">60%</p>
              <p className="mt-2 text-sm text-stone-700">24 of 40 total model citations</p>
            </article>
            <article className="surface-card rounded-[1.8rem] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Competitor B
              </p>
              <p className="mt-3 text-3xl font-semibold text-stone-950">30%</p>
              <p className="mt-2 text-sm text-stone-700">12 of 40 total model citations</p>
            </article>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold transition"
              href="/proof/sample-audit-report.html"
              rel="noreferrer"
              target="_blank"
            >
              Open Sample Audit
            </a>
            <a
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href="/checkout/audit"
            >
              Get Full Audit
            </a>
          </div>
        </div>

        <div className="surface-card overflow-hidden rounded-[2rem] border border-[rgba(72,52,40,0.1)]">
          <div className="border-b border-[rgba(72,52,40,0.08)] bg-[rgba(255,252,247,0.84)] px-5 py-4">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
              What AI says when buyers ask
            </p>
          </div>
          <div className="grid gap-px bg-[rgba(72,52,40,0.08)]">
            <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr] gap-px bg-[rgba(72,52,40,0.08)] text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              <div className="bg-[rgba(255,252,247,0.92)] px-4 py-3">Query</div>
              <div className="bg-[rgba(255,252,247,0.92)] px-4 py-3">Claude</div>
              <div className="bg-[rgba(255,252,247,0.92)] px-4 py-3">ChatGPT</div>
            </div>
            {sampleQueries.map((item, index) => (
              <div
                className="grid grid-cols-[1.3fr_0.8fr_0.8fr] gap-px bg-[rgba(72,52,40,0.08)]"
                key={item.query}
              >
                <div
                  className={`px-4 py-4 text-sm leading-6 text-stone-800 ${
                    index % 2 === 0 ? "bg-[rgba(255,252,247,0.94)]" : "bg-[rgba(250,244,236,0.94)]"
                  }`}
                >
                  {item.query}
                </div>
                <div
                  className={`px-4 py-4 text-sm font-semibold ${item.claudeTone} ${
                    index % 2 === 0 ? "" : ""
                  }`}
                >
                  {item.claude}
                </div>
                <div className={`px-4 py-4 text-sm font-semibold ${item.chatgptTone}`}>
                  {item.chatgpt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3" id="platform">
        {howItWorks.map((phase) => (
          <article
            className="surface-card rounded-[2rem] p-5 transition duration-200 hover:-translate-y-1"
            key={phase.name}
          >
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
              {phase.name}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950">
              {phase.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">{phase.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <article className="surface-panel rounded-[2.2rem] p-6 md:p-8">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            {pilotProof.stageLabel}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {pilotProof.company} moved from AI invisibility to measurable citation lift.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
            AEOSpark identified the prompts where competitors were being cited,
            then prioritized direct-answer copy, comparison pages, and stronger
            trust proof. The result was not just a better score. It was a
            material increase in the prompts where AI assistants mentioned the brand.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {pilotProof.note}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {caseStudyStats.map((item) => (
              <div className="surface-card rounded-[1.8rem] p-5" key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-stone-950">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full w-[34%] rounded-full bg-gradient-to-r from-emerald-700 to-teal-500" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            <span>Before: {pilotProof.beforeCitationShare}</span>
            <span>After: {pilotProof.afterCitationShare}</span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href="/proof/alphawhale-case-study.html"
              rel="noreferrer"
              target="_blank"
            >
              Read Case Study
            </a>
            <a
              className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
              href="/proof/citation-share-story.html"
              rel="noreferrer"
              target="_blank"
            >
              See Before / After
            </a>
          </div>
        </article>

        <article className="surface-panel rounded-[2.2rem] p-6 md:p-8">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Founder note
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            Built for teams that know AI visibility matters but do not have time to reverse-engineer it.
          </h2>
          <p className="mt-4 text-sm leading-7 text-stone-700">
            AEOSpark exists because most marketing teams can feel AI assistants
            skipping over them, but cannot see the exact prompts, exact competitors,
            and exact content gaps causing it. The product is designed to make
            that invisible problem obvious, measurable, and fixable.
          </p>
          <div className="mt-6">
            <FounderTrustCard />
          </div>
          <div className="mt-6 grid gap-3 text-sm leading-7 text-stone-700">
            <p>• Free score for the problem diagnosis</p>
            <p>• Paid audit for prompt-level evidence and fix order</p>
            <p>• Implementation guidance for teams that want measurable improvement</p>
          </div>
          <div className="mt-6 rounded-[1.7rem] border border-[rgba(72,52,40,0.12)] bg-[rgba(255,252,247,0.72)] px-5 py-4 text-sm leading-7 text-stone-700">
            If you do not learn at least three specific, actionable ways to improve
            AI visibility from the paid audit, AEOSpark refunds the purchase in full.
          </div>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {signals.map((signal) => (
          <article
            className="surface-card rounded-[2rem] p-5 transition duration-200 hover:-translate-y-1"
            key={signal.title}
          >
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
              Why teams run the score
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950">{signal.title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-700">{signal.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
