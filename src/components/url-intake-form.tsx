"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UrlIntakeForm() {
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
        url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`,
      );
      setIsPending(true);
      const params = new URLSearchParams({ url: normalized.toString() });
      if (competitorUrl.trim()) {
        const normalizedCompetitor = new URL(
          competitorUrl.startsWith("http://") || competitorUrl.startsWith("https://")
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
    <form
      className="surface-card grid gap-5 rounded-[2rem] p-5 shadow-[0_30px_100px_rgba(83,61,47,0.08)]"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
          Instant AEO check
        </p>
        <p className="mt-2 text-sm text-stone-700">
          Paste a site. We return the score, gaps, and next move.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-900">Primary company URL</span>
          <input
            className="input-field h-14 rounded-2xl px-4 text-sm transition"
            placeholder="https://yourcompany.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-stone-900">
            Optional competitor URL
          </span>
          <input
            className="input-field h-14 rounded-2xl px-4 text-sm transition"
            placeholder="https://competitor.com"
            value={competitorUrl}
            onChange={(event) => setCompetitorUrl(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-stone-700">
          Results usually return in under 60 seconds.
        </div>
        <button
          className="btn-primary inline-flex h-14 items-center justify-center rounded-2xl px-6 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Opening score..." : "Check My Score"}
        </button>
      </div>

      {error ? <p className="status-danger text-sm">{error}</p> : null}
    </form>
  );
}
