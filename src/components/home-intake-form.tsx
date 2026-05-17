"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/loading-spinner";

/**
 * Homepage-specific intake form. Same submit logic as
 * `UrlIntakeForm` — kept separate here because the homepage hero
 * needs a distinct visual treatment that we don't want to propagate
 * to other pages that use `UrlIntakeForm`.
 */
export function HomeIntakeForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const normalized = new URL(
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`,
      );
      setIsPending(true);
      const params = new URLSearchParams({ url: normalized.toString() });
      if (competitorUrl.trim()) {
        const normalizedCompetitor = new URL(
          competitorUrl.startsWith("http://") ||
          competitorUrl.startsWith("https://")
            ? competitorUrl
            : `https://${competitorUrl}`,
        );
        params.set("competitor", normalizedCompetitor.toString());
      }
      router.push(`/score?${params.toString()}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? "Enter a valid public website URL."
          : "Something went wrong while preparing the AEO scan.",
      );
      setIsPending(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
          Your website
        </span>
        <input
          id="home-intake-url"
          className="h-11 rounded-lg border border-[var(--border-strong)] bg-white px-3.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15"
          placeholder="yourcompany.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--foreground-subtle)]">
          Competitor URL (optional)
        </span>
        <input
          className="h-11 rounded-lg border border-[var(--border-strong)] bg-white px-3.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/15"
          placeholder="competitor.com"
          value={competitorUrl}
          onChange={(event) => setCompetitorUrl(event.target.value)}
        />
      </label>

      <button
        className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2D6A4F] text-sm font-medium text-white transition hover:bg-[#225239] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending && <LoadingSpinner size="sm" className="text-white/80" />}
        {isPending ? "Opening score…" : "Check my score →"}
      </button>

      <p className="text-center text-xs text-[var(--foreground-subtle)]">
        Free forever · No account required · Results in ~60s
      </p>

      {error ? (
        <p className="text-center text-xs text-[#A32D2D]">{error}</p>
      ) : null}
    </form>
  );
}
