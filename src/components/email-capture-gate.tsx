"use client";

import { useEffect, useState } from "react";

import type { Recommendation } from "@/lib/types";

function unlockKey(website: string) {
  try {
    return `aeospark-unlocked:${new URL(website).hostname}`;
  } catch {
    return `aeospark-unlocked:${website}`;
  }
}

export function EmailCaptureGate(props: {
  recommendations: Recommendation[];
  score: number;
  scoreId: string;
  website: string;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(unlockKey(props.website));
    if (stored === "true") {
      setIsUnlocked(true);
    }
  }, [props.website]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          scoreId: props.scoreId,
          score: props.score,
          website: props.website,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save lead.");
      }

      window.localStorage.setItem(unlockKey(props.website), "true");
      setIsUnlocked(true);
      setStatus(
        "Full recommendation set unlocked. The summary email and follow-up sequence were queued in local mock mode.",
      );
    } catch (caughtError) {
      setStatus(
        caughtError instanceof Error
          ? caughtError.message
          : "Lead capture failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Lead Capture
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Full 10-fix roadmap
          </h2>
        </div>
        <p className="max-w-xl text-sm text-slate-300">
          The first three recommendations stay public. The remaining fixes unlock
          after email capture, matching the FRD gate.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {props.recommendations.map((recommendation, index) => {
            const locked = recommendation.locked && !isUnlocked;
            return (
              <article
                className={`rounded-3xl border p-4 transition ${
                  locked
                    ? "border-white/8 bg-slate-950/50 blur-[1.5px]"
                    : "border-white/10 bg-slate-950/65"
                }`}
                key={recommendation.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Fix {index + 1}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {recommendation.impact} impact / {recommendation.effort} effort
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {locked ? "Unlock full roadmap" : recommendation.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {locked
                    ? "This recommendation is intentionally hidden until the lead gate is completed."
                    : recommendation.detail}
                </p>
              </article>
            );
          })}
        </div>

        <div className="rounded-3xl border border-sky-400/20 bg-sky-500/10 p-5">
          <h3 className="text-xl font-semibold text-white">
            Email gate unlock
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Capture name and business email to queue the 3-page summary, unlock all
            recommendations, and arm the audit CTA.
          </p>

          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <input
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-sky-400"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <input
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-sky-400"
              placeholder="Business email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <button
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Unlocking..." : "Unlock full roadmap"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/90">
              What happens next
            </p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-300">
              <li>Summary email queued immediately</li>
              <li>48-hour follow-up nudge queued</li>
              <li>Audit checkout prefill becomes available</li>
            </ul>
          </div>

          {status ? (
            <p className="mt-4 text-sm text-sky-100">{status}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
