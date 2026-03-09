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
    setIsPending(true);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url,
          competitorUrl: competitorUrl || undefined,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        scoreId?: string;
      };

      if (!response.ok || !payload.scoreId) {
        throw new Error(payload.error || "Unable to score the supplied site.");
      }

      router.push(`/score/${payload.scoreId}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while running the AEO scan.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-[2rem] border border-white/14 bg-slate-950/70 p-5 shadow-[0_30px_120px_rgba(8,14,26,0.65)] backdrop-blur"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-white">Primary company URL</span>
          <input
            className="h-14 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-sky-400"
            placeholder="https://yourcompany.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-white">
            Optional competitor URL
          </span>
          <input
            className="h-14 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition focus:border-sky-400"
            placeholder="https://competitor.com"
            value={competitorUrl}
            onChange={(event) => setCompetitorUrl(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-100/88">
          Results usually return in under 20 seconds.
        </div>
        <button
          className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 px-6 text-sm font-bold text-slate-950 shadow-[0_18px_50px_rgba(56,189,248,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Scoring site..." : "Check My Score"}
        </button>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
