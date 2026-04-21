import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function DashboardPlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10">
      <SiteHeader />

      <section className="surface-panel grid gap-5 rounded-[2.5rem] p-8">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
          Dashboard
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          Coming soon
        </h1>
        <p className="max-w-2xl text-base leading-7 text-stone-700">
          Client reporting and monitoring will live here. For now, here&apos;s what
          you can do:
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            className="surface-card grid gap-3 rounded-[1.8rem] p-5 transition duration-200 hover:-translate-y-1"
            href="/"
          >
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
              Free tool
            </p>
            <h2 className="text-lg font-semibold text-stone-950">Run a score</h2>
            <p className="text-sm leading-6 text-stone-700">
              Check any URL against seven AI visibility signals in under a minute.
            </p>
          </Link>

          <Link
            className="surface-card grid gap-3 rounded-[1.8rem] p-5 transition duration-200 hover:-translate-y-1"
            href="/checkout/audit"
          >
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
              Premium
            </p>
            <h2 className="text-lg font-semibold text-stone-950">Get full audit</h2>
            <p className="text-sm leading-6 text-stone-700">
              Prompt-by-prompt competitor analysis with a 30/60/90-day roadmap.
            </p>
          </Link>

          <Link
            className="surface-card grid gap-3 rounded-[1.8rem] p-5 transition duration-200 hover:-translate-y-1"
            href="/account"
          >
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
              Account
            </p>
            <h2 className="text-lg font-semibold text-stone-950">My reports</h2>
            <p className="text-sm leading-6 text-stone-700">
              Access delivered audit reports and manage your account profile.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
