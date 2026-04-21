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
  const [step, setStep] = useState("Fetching your website...");
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

          setStep(pollPayload.data?.step || "Calculating your score...");
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
      <section className="surface-panel grid gap-5 rounded-[2rem] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-stone-950">Unable to run score</h1>
        </div>
        <p className="text-base leading-7 text-stone-700">{error}</p>
        <button
          className="btn-primary inline-flex h-12 w-fit items-center justify-center rounded-2xl px-5 text-sm font-bold transition"
          onClick={() => window.location.reload()}
          type="button"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="surface-panel grid gap-5 rounded-[2rem] p-6">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
          Running your score
        </p>
        <h1 className="text-4xl font-semibold text-stone-950">
          Analyzing {url}
        </h1>
        <div className="flex items-center gap-3">
          <LoadingSpinner size="sm" className="text-[var(--accent)]" />
          <p className="text-base leading-7 text-stone-700">{step}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)] transition-all duration-700 ease-out"
            style={{ width: `${Math.min((revealed / 7) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="app-stagger-in grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DIMENSION_LABELS.map((label, index) => {
          const isRevealed = revealed > index;
          return (
            <article
              className={`surface-card rounded-3xl p-5 transition duration-500 ${
                isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
              }`}
              key={label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {label}
              </p>
              <div className={`mt-4 h-8 w-16 rounded-xl bg-stone-200 ${!isRevealed ? "app-skeleton-pulse" : ""}`} />
              <div className={`mt-5 h-2 rounded-full bg-stone-200 ${!isRevealed ? "app-skeleton-pulse" : ""}`} />
              <div className={`mt-5 h-4 rounded-xl bg-stone-100 ${!isRevealed ? "app-skeleton-pulse" : ""}`} />
              <div className={`mt-3 h-4 w-11/12 rounded-xl bg-stone-100 ${!isRevealed ? "app-skeleton-pulse" : ""}`} />
            </article>
          );
        })}
      </div>
    </section>
  );
}
