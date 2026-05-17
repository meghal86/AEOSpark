import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const actions = [
  {
    href: "/",
    label: "Run a score",
    detail: "Check any URL against seven AI visibility signals in under a minute.",
  },
  {
    href: "/checkout/audit",
    label: "Get full audit",
    detail: "Prompt-by-prompt competitor analysis with a 30/60/90-day roadmap.",
  },
  {
    href: "/account",
    label: "My reports",
    detail: "Access delivered audit reports and manage your account profile.",
  },
];

export default function DashboardPlaceholderPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader />

      <section className="app-fade-up pt-16 pb-24 md:pt-24">
        <span className="ui-kicker">Dashboard</span>
        <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
          Coming soon.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">
          Client reporting and continuous monitoring will live here. For now,
          here&rsquo;s what you can do.
        </p>

        <div className="mt-14 grid gap-0">
          {actions.map((action, index) => (
            <Link
              key={action.href}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-8 border-t border-[var(--border)] py-6 transition hover:bg-[var(--surface-muted)] last:border-b"
              href={action.href}
            >
              <span className="font-display text-3xl tracking-tight text-[var(--foreground-subtle)] transition group-hover:text-[var(--accent)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xl font-medium text-[var(--foreground)]">
                  {action.label}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  {action.detail}
                </p>
              </div>
              <span className="text-[var(--foreground-subtle)] transition group-hover:translate-x-1 group-hover:text-[var(--accent)]">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
