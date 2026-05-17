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
      setStatus("Unlocked. Check your inbox for the summary.");
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
    <section className="app-fade-up">
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-end md:gap-16">
        <div className="md:max-w-xs">
          <span className="ui-kicker">Fix roadmap</span>
          <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
            Your 10 leverage points.
          </h2>
          <p className="mt-4 text-sm leading-relaxed">
            First 3 fixes are free. The rest unlock with an email — delivered
            to your inbox as a summary.
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
        <div className="grid gap-0">
          {props.recommendations.map((recommendation, index) => {
            const locked = recommendation.locked && !isUnlocked;

            return (
              <article
                key={recommendation.id}
                className="relative grid grid-cols-[auto_1fr_auto] items-start gap-6 border-t border-[var(--border)] py-6 last:border-b"
              >
                <span className="font-display text-2xl tracking-tight text-[var(--foreground-subtle)]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div
                  className={
                    locked ? "pointer-events-none select-none blur-[4px]" : undefined
                  }
                >
                  <p className="text-base font-medium text-[var(--foreground)]">
                    {locked ? "Unlock full roadmap" : recommendation.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {locked
                      ? "Hidden until the roadmap is unlocked with your email."
                      : recommendation.detail}
                  </p>
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--foreground-subtle)]">
                  {recommendation.impact}/{recommendation.effort}
                </span>

                {locked ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-2">
                    <span className="inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)]">
                      Locked
                    </span>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <aside className="grid gap-6 self-start lg:sticky lg:top-8">
          <div>
            <span className="ui-kicker">Unlock</span>
            <h3 className="mt-3 text-2xl tracking-tight">Get all 10 fixes.</h3>
            <p className="mt-3 text-sm leading-relaxed">
              Enter your details and we&rsquo;ll email the summary. No spam —
              one email, the roadmap, and that&rsquo;s it.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              Name
              <input
                className="input-field h-12 px-4 text-sm"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
              Business email
              <input
                className="input-field h-12 px-4 text-sm"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <button
              className="btn-accent inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || isUnlocked}
              type="submit"
            >
              {isUnlocked
                ? "Unlocked ✓"
                : isSubmitting
                  ? "Unlocking…"
                  : "Unlock full roadmap →"}
            </button>
          </form>

          {status ? (
            <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{status}</p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
