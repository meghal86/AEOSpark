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
        "Unlocked. Check your inbox for the summary.",
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
    <section className="surface-panel grid gap-5 rounded-[2rem] p-6 app-fade-up">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Your fix roadmap
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">
            Full 10-fix roadmap
          </h2>
        </div>
        <p className="max-w-xl text-sm text-stone-700">First 3 fixes are free. The rest unlock after email.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {props.recommendations.map((recommendation, index) => {
            const locked = recommendation.locked && !isUnlocked;
            return (
              <article
                className={`relative rounded-3xl border p-4 transition duration-200 ${
                  locked
                    ? "border-[rgba(72,52,40,0.08)] bg-[rgba(255,252,247,0.58)]"
                    : "border-[rgba(72,52,40,0.1)] bg-[rgba(255,252,247,0.78)] hover:-translate-y-0.5"
                }`}
                key={recommendation.id}
              >
                <div
                  className={
                    locked ? "pointer-events-none select-none blur-sm" : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Fix {index + 1}
                    </span>
                    <span className="ui-chip rounded-full px-3 py-1 text-xs">
                      {recommendation.impact} impact / {recommendation.effort} effort
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-stone-950">
                    {locked ? "Unlock full roadmap" : recommendation.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    {locked
                      ? "This recommendation is intentionally hidden until the roadmap is unlocked."
                      : recommendation.detail}
                  </p>
                </div>
                {locked ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-[rgba(255,252,247,0.18)]">
                    <span className="ui-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
                      Locked until email unlock
                    </span>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <div className="surface-card rounded-3xl p-5">
          <h3 className="text-xl font-semibold text-stone-950">
            Unlock full roadmap
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone-700">Enter your details to see all 10 fixes.</p>

          <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Name
            <input
              className="input-field h-12 rounded-2xl px-4 text-sm"
              placeholder="Your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Business email
            <input
              className="input-field h-12 rounded-2xl px-4 text-sm"
              placeholder="Business email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            </label>

            <button
              className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Unlocking..." : "Unlock full roadmap"}
            </button>
          </form>

          {status ? (
            <p className="mt-4 text-sm text-stone-800">{status}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
