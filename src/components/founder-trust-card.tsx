import Image from "next/image";

import { founderProfile } from "@/lib/site-proof";

export function FounderTrustCard(props?: { compact?: boolean }) {
  const compact = props?.compact ?? false;
  const initials = founderProfile.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="flex items-start gap-4">
        {founderProfile.photoUrl ? (
          <Image
            alt={founderProfile.name}
            className="h-14 w-14 rounded-full object-cover"
            height={56}
            src={founderProfile.photoUrl}
            unoptimized
            width={56}
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-deep)]">
            {initials}
          </div>
        )}
        <div className="grid gap-0.5">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {founderProfile.name}
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">{founderProfile.role}</p>
        </div>
      </div>

      <p
        className={`mt-5 text-sm leading-relaxed text-[var(--foreground-muted)] ${
          compact ? "" : "max-w-2xl"
        }`}
      >
        {founderProfile.bio}
      </p>

      <div className="mt-5 flex flex-wrap gap-5 border-t border-[var(--border)] pt-4 text-sm">
        {founderProfile.linkedInUrl ? (
          <a
            className="font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            href={founderProfile.linkedInUrl}
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn →
          </a>
        ) : null}
        <a
          className="font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
          href="mailto:hello@aeospark.com"
        >
          Email →
        </a>
      </div>
    </div>
  );
}
