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
    <div className="rounded-[1.7rem] border border-[rgba(72,52,40,0.12)] bg-[rgba(255,252,247,0.72)] p-5">
      <div className="flex items-start gap-4">
        {founderProfile.photoUrl ? (
          <Image
            alt={founderProfile.name}
            className="h-16 w-16 rounded-[1.25rem] object-cover"
            height={64}
            src={founderProfile.photoUrl}
            unoptimized
            width={64}
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,#f3e6d4,#ead7c1)] text-lg font-semibold text-stone-950">
            {initials}
          </div>
        )}
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-stone-950">{founderProfile.name}</p>
          <p className="text-sm text-stone-700">{founderProfile.role}</p>
        </div>
      </div>

      <p className={`mt-4 text-sm leading-7 text-stone-700 ${compact ? "" : "max-w-2xl"}`}>
        {founderProfile.bio}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {founderProfile.linkedInUrl ? (
          <a
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            href={founderProfile.linkedInUrl}
            rel="noreferrer"
            target="_blank"
          >
            View LinkedIn
          </a>
        ) : null}
        <a
          className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
          href="mailto:hello@aeospark.com"
        >
          Email Founder
        </a>
      </div>
    </div>
  );
}
