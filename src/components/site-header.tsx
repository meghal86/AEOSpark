import Link from "next/link";

import { AuthHeaderActions } from "@/components/auth-header-actions";
import { MobileNavWrapper } from "@/components/mobile-nav-wrapper";

export function SiteHeader(props?: {
  /** Hide nav links — useful on auth pages. */
  minimal?: boolean;
  /** Override the default navigation links. */
  navLinks?: { href: string; label: string }[];
  /** Show a prominent CTA button in the nav. */
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const minimal = props?.minimal ?? false;
  const navLinks = props?.navLinks ?? [
    { href: "/#platform", label: "How it works" },
    { href: "/checkout/audit", label: "Full Audit" },
  ];
  const ctaLabel = props?.ctaLabel;
  const ctaHref = props?.ctaHref ?? "/checkout/audit";

  return (
    <header className="relative flex items-center justify-between gap-4">
      <Link
        className="ui-chip inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur transition hover:scale-[1.02]"
        href="/"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
        AEOSpark
      </Link>

      {!minimal && (
        <>
          {/* Desktop navigation */}
          <div className="hidden items-center gap-5 md:flex">
            {navLinks.map((link) => (
              <Link
                className="text-sm font-semibold text-stone-700 transition hover:text-stone-950"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            {ctaLabel && (
              <Link
                className="btn-primary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold transition"
                href={ctaHref}
              >
                {ctaLabel}
              </Link>
            )}
            <AuthHeaderActions className="flex items-center gap-3" />
          </div>

          {/* Mobile navigation */}
          <MobileNavWrapper>
            {navLinks.map((link) => (
              <Link
                className="flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100/60 hover:text-stone-950"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            {ctaLabel && (
              <Link
                className="flex h-11 items-center rounded-xl px-4 text-sm font-bold text-[var(--accent)] transition hover:bg-stone-100/60"
                href={ctaHref}
              >
                {ctaLabel}
              </Link>
            )}
            <div className="my-1 h-px bg-[rgba(72,52,40,0.08)]" />
            <AuthHeaderActions
              className="grid gap-1"
              linkClassName="flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100/60 hover:text-stone-950"
              buttonClassName="flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100/60 hover:text-stone-950 text-left"
            />
          </MobileNavWrapper>
        </>
      )}

      {minimal && (
        <AuthHeaderActions className="flex items-center gap-3" />
      )}
    </header>
  );
}
