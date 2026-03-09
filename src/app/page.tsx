import Link from "next/link";

import { UrlIntakeForm } from "@/components/url-intake-form";

const phases = [
  {
    name: "Phase 1",
    title: "Acquisition",
    detail: "Run a score. See the gap fast.",
  },
  {
    name: "Phase 2",
    title: "Lead capture",
    detail: "Unlock the full roadmap with email.",
  },
  {
    name: "Phase 3",
    title: "Conversion",
    detail: "Turn the score into a paid audit.",
  },
  {
    name: "Phase 4",
    title: "Retainer expansion",
    detail: "Track progress in the client portal.",
  },
];

const pillars = [
  {
    title: "Fast score",
    body: "Six dimensions. One number.",
  },
  {
    title: "Lean capture",
    body: "Simple gate. Full roadmap.",
  },
  {
    title: "Outcome first",
    body: "Audit, implement, improve.",
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
            className="text-sm font-semibold text-slate-100 transition hover:text-sky-200"
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
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                  Score a site, surface the gaps, and move high-intent leads into audit and implementation.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {pillars.map((pillar) => (
                  <article
                    className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur"
                    key={pillar.title}
                  >
                    <h2 className="text-lg font-semibold text-white">{pillar.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-100/88">
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
            <p className="mt-3 text-sm leading-6 text-slate-100/88">{phase.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
