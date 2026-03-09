import Link from "next/link";

import { UrlIntakeForm } from "@/components/url-intake-form";

const phases = [
  {
    name: "Phase 1",
    title: "Acquisition",
    detail:
      "Free AEO score widget converts curiosity into a quantified problem. Optional competitor comparison makes the result more viral and more painful.",
  },
  {
    name: "Phase 2",
    title: "Lead capture",
    detail:
      "Email gate unlocks the full roadmap, queues the teaser summary, and starts the follow-up sequence without adding heavy friction.",
  },
  {
    name: "Phase 3",
    title: "Conversion",
    detail:
      "Single-page audit checkout with inline decline handling turns a weak score into a paid $2,500 audit and a scheduled strategy call.",
  },
  {
    name: "Phase 4",
    title: "Retainer expansion",
    detail:
      "Client portal supports implementation reporting, official-API monitoring, and the eventual managed-service retainer motion.",
  },
];

const pillars = [
  {
    title: "Score the problem fast",
    body: "Analyze a public site, break it into six AI-readiness dimensions, and make the gaps visible in one uncomfortable number.",
  },
  {
    title: "Capture the lead cleanly",
    body: "Keep the gate lean: name, business email, stored score context, queued PDF summary, and a 48-hour nudge.",
  },
  {
    title: "Sell outcomes, not dashboards",
    body: "The audit and implementation flow is the business. Monitoring exists to make the service more efficient, not to lead the motion.",
  },
];

const dataFlows = [
  {
    label: "Scores",
    detail:
      "Stored locally in JSON for this build, shaped to swap to Supabase later with score payload, crawl status, comparison, and recommendations.",
  },
  {
    label: "Lead automation",
    detail:
      "Lead capture queues a welcome summary plus a 48-hour follow-up job, matching the FRD nurture flow without needing live email credentials first.",
  },
  {
    label: "Audit pipeline",
    detail:
      "Successful checkout creates the order, client portal, and queued audit job. Replace the local adapter with Stripe, Inngest, Resend, and Supabase when ready.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-8 md:px-10 md:py-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/90 backdrop-blur">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            AEOSpark
          </div>
          <Link
            className="text-sm font-semibold text-slate-300 transition hover:text-white"
            href="#platform"
          >
            Platform overview
          </Link>
        </div>

        <section className="relative overflow-hidden rounded-[2.7rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_24%),radial-gradient(circle_at_80%_0%,_rgba(16,185,129,0.18),_transparent_22%),linear-gradient(160deg,#08111f,#091527_50%,#07131f)] px-6 py-8 shadow-[0_40px_120px_rgba(6,12,22,0.75)] md:px-10 md:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-6">
              <div className="inline-flex w-fit items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Agent Engine Optimization implementation platform
              </div>

              <div>
                <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                  Make brands visible in AI recommendations, then sell the implementation.
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                  This build follows the FRD directly: free widget, email gate, paid
                  audit checkout, confirmation flow, and a client portal for
                  citation-share reporting.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {pillars.map((pillar) => (
                  <article
                    className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur"
                    key={pillar.title}
                  >
                    <h2 className="text-lg font-semibold text-white">{pillar.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {pillar.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="self-end">
              <UrlIntakeForm />
            </div>
          </div>
        </section>
      </header>

      <section className="grid gap-5 md:grid-cols-4" id="platform">
        {phases.map((phase) => (
          <article
            className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur"
            key={phase.name}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
              {phase.name}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {phase.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{phase.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 rounded-[2.2rem] border border-white/10 bg-white/6 p-6 backdrop-blur lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            User flow coverage
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Acquisition to retainer, built as one application
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            The app covers the exact path you described: landing page, score results,
            email gate, checkout, confirmation, and monitor dashboard. It is implemented
            in a local-first way so it runs immediately, while the architecture leaves
            clear swap points for Supabase, Stripe, Resend, and Inngest.
          </p>
        </div>

        <div className="grid gap-3">
          {dataFlows.map((flow) => (
            <article
              className="rounded-3xl border border-white/10 bg-slate-950/55 p-4"
              key={flow.label}
            >
              <p className="text-sm font-semibold text-white">{flow.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{flow.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
