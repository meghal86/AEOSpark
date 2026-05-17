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
    { href: "/#how", label: "How it works" },
    { href: "/checkout/audit", label: "Full Audit" },
  ];
  const ctaLabel = props?.ctaLabel;
  const ctaHref = props?.ctaHref ?? "/checkout/audit";

  return (
    <header className="relative flex items-center justify-between py-2">
      <Link
        className="group inline-flex items-center gap-2.5 text-[0.95rem] font-semibold tracking-tight text-[var(--foreground)] transition"
        href="/"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--accent)] transition group-hover:scale-110" />
        AEOSpark
      </Link>

      {!minimal && (
        <>
          {/* Desktop navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                className="text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-4 w-px bg-[var(--border)]" />
            <AuthHeaderActions
              className="flex items-center gap-5"
              linkClassName="text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
              buttonClassName="btn-ghost inline-flex h-9 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium transition"
            />
            {ctaLabel && (
              <Link
                className="btn-primary inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] px-4 text-sm font-semibold transition"
                href={ctaHref}
              >
                {ctaLabel}
              </Link>
            )}
          </div>

          {/* Mobile navigation */}
          <MobileNavWrapper>
            {navLinks.map((link) => (
              <Link
                className="flex h-11 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            {ctaLabel && (
              <Link
                className="flex h-11 items-center rounded-[var(--radius-sm)] px-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
                href={ctaHref}
              >
                {ctaLabel}
              </Link>
            )}
            <div className="my-1 h-px bg-[var(--border)]" />
            <AuthHeaderActions
              className="grid gap-1"
              linkClassName="flex h-11 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              buttonClassName="flex h-11 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] text-left"
            />
          </MobileNavWrapper>
        </>
      )}

      {minimal && (
        <AuthHeaderActions
          className="flex items-center gap-4"
          linkClassName="text-sm font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
          buttonClassName="btn-ghost inline-flex h-9 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium transition"
        />
      )}
    </header>
  );
}
