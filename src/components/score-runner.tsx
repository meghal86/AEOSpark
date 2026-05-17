"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/loading-spinner";

type ScoreApiResponse = {
  success: boolean;
  data?: {
    cached?: boolean;
    scoreId?: string;
    status?: "processing" | "complete";
    step?: string;
  };
  error?: string;
};

const DIMENSION_LABELS = [
  "AI Crawler Access",
  "Structured Data",
  "Content Architecture",
  "Pricing Visibility",
  "Authority Signals",
  "Bing Presence",
  "Brand Footprint",
];

export function ScoreRunner({ url }: { url: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [step, setStep] = useState("Fetching your website…");
  const [revealed, setRevealed] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const maxPolls = 90;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const response = await fetch("/api/score", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const payload = (await response.json()) as ScoreApiResponse;
        if (!response.ok || !payload.data?.scoreId) {
          throw new Error(payload.error || "Unable to start the score.");
        }

        const scoreId = payload.data.scoreId;
        const poll = async () => {
          setPollCount((current) => current + 1);
          const pollResponse = await fetch(`/api/score/${scoreId}`, {
            cache: "no-store",
          });
          const pollPayload = (await pollResponse.json()) as ScoreApiResponse & {
            data?: {
              status?: "processing" | "complete";
              step?: string;
            };
          };

          if (cancelled) {
            return;
          }

          if (!pollResponse.ok) {
            throw new Error(pollPayload.error || "Unable to fetch score progress.");
          }

          if (pollPayload.data?.status === "complete") {
            if (intervalRef.current) {
              window.clearInterval(intervalRef.current);
            }
            router.replace(`/score/${scoreId}`);
            return;
          }

          setStep(pollPayload.data?.step || "Calculating your score…");
        };

        await poll();
        if (!payload.data.cached && !cancelled) {
          intervalRef.current = window.setInterval(() => {
            void poll();
          }, 2_000);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to complete the score request.",
          );
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [router, url]);

  useEffect(() => {
    if (error || pollCount < maxPolls) {
      return;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    setError(
      "This score is taking longer than expected. Please try again in a minute.",
    );
  }, [error, pollCount]);

  useEffect(() => {
    if (error) return;
    if (revealed >= 7) return;
    const timer = window.setTimeout(() => setRevealed((current) => current + 1), 400);
    return () => window.clearTimeout(timer);
  }, [error, revealed]);

  if (error) {
    return (
      <section className="pt-16 pb-24 md:pt-24">
        <span className="ui-kicker status-danger">Score failed</span>
        <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
          Unable to run score
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">{error}</p>
        <button
          className="btn-primary mt-8 inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
          onClick={() => window.location.reload()}
          type="button"
        >
          Try again
        </button>
      </section>
    );
  }

  const progressPct = Math.min((revealed / 7) * 100, 100);

  return (
    <section className="pt-16 pb-24 md:pt-24">
      <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        <LoadingSpinner size="sm" className="text-[var(--accent)]" />
        Running your score
      </div>

      <h1 className="mt-6 text-5xl tracking-tight md:text-6xl">
        Analyzing{" "}
        <span className="text-[var(--accent)]">{url}</span>
      </h1>

      <p className="mt-5 text-base leading-relaxed text-[var(--foreground-muted)]">
        {step}
      </p>

      {/* Progress bar */}
      <div className="mt-10 grid gap-2">
        <div className="h-[2px] overflow-hidden rounded-full bg-[var(--divider)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--foreground-subtle)]">
          <span>
            {revealed} of 7 signals scored
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
      </div>

      {/* Dimension list - report style */}
      <div className="app-stagger-in mt-16 grid gap-0">
        {DIMENSION_LABELS.map((label, index) => {
          const isRevealed = revealed > index;
          return (
            <article
              className="grid grid-cols-[auto_1fr_auto] items-center gap-6 border-t border-[var(--border)] py-5 last:border-b"
              key={label}
            >
              <span className="font-display text-xl tracking-tight text-[var(--foreground-subtle)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-base font-medium text-[var(--foreground)]">
                  {label}
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                  {isRevealed ? "Scored" : "Pending…"}
                </p>
              </div>
              <div className="flex h-7 w-16 items-center justify-end">
                {isRevealed ? (
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      ✓
                    </span>
                  </div>
                ) : (
                  <div className="app-skeleton-pulse h-2 w-12 rounded-full bg-[var(--divider)]" />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
