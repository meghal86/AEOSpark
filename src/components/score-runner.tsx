"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
    const timer = window.setTimeout(() => setRevealed((current) => current + 1), 300);
    return () => window.clearTimeout(timer);
  }, [error, revealed]);

  if (error) {
    return (
      <section className="surface-panel grid gap-4 rounded-[2rem] p-6">
        <h1 className="text-3xl font-semibold text-stone-950">Unable to run score</h1>
        <p className="text-base leading-7 text-stone-700">{error}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="surface-panel grid gap-4 rounded-[2rem] p-6">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
          Running your score
        </p>
        <h1 className="text-4xl font-semibold text-stone-950">Analyzing {url}</h1>
        <p className="text-base leading-7 text-stone-700">{step}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <article
            className={`surface-card rounded-3xl p-5 transition ${revealed > index ? "opacity-100" : "opacity-35"}`}
            key={index}
          >
            <div className="h-4 w-28 rounded-full bg-stone-200" />
            <div className="mt-4 h-8 w-16 rounded-full bg-stone-200" />
            <div className="mt-5 h-2 rounded-full bg-stone-200" />
            <div className="mt-5 h-4 rounded-full bg-stone-100" />
            <div className="mt-3 h-4 w-11/12 rounded-full bg-stone-100" />
          </article>
        ))}
      </div>
    </section>
  );
}
