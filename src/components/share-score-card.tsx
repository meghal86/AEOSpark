"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

import { scoreTone } from "@/lib/format";

export function ShareScoreCard(props: {
  companyName: string;
  url: string;
  overallScore: number;
  weakestDimensions: Array<{ label: string; score: number }>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("");
  const tone = scoreTone(props.overallScore);

  async function downloadCard() {
    if (!ref.current) {
      return;
    }

    try {
      const dataUrl = await toPng(ref.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const anchor = document.createElement("a");
      anchor.download = `${props.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-aeospark-score.png`;
      anchor.href = dataUrl;
      anchor.click();
      setStatus("Score card downloaded.");
    } catch {
      setStatus("Unable to export the score card in this browser.");
    }
  }

  function shareOnLinkedIn() {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.href,
    )}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="surface-panel grid gap-4 rounded-[2rem] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Share your score
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">
            Shareable score card
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            onClick={downloadCard}
            type="button"
          >
            Download PNG
          </button>
          <button
            className="btn-primary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold transition"
            onClick={shareOnLinkedIn}
            type="button"
          >
            Share on LinkedIn
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[1.75rem] border border-[rgba(72,52,40,0.1)]"
        ref={ref}
      >
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(181,139,118,0.24),_transparent_32%),linear-gradient(135deg,#faf6ef,#f1e8db_45%,#e7dac8)] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            AEOSpark Score Card
          </p>
          <div className="mt-6 flex items-end justify-between gap-6">
            <div>
              <h3 className="max-w-xs text-3xl font-semibold text-stone-950">
                {props.companyName}
              </h3>
              <p className="mt-2 text-sm text-stone-700">{props.url}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold uppercase ${tone.className}`}>
                {tone.label}
              </p>
              <p className="text-6xl font-semibold text-stone-950">
                {props.overallScore}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {props.weakestDimensions.map((dimension) => (
              <div
                className="rounded-3xl border border-[rgba(72,52,40,0.1)] bg-[rgba(255,252,247,0.62)] p-4"
                key={dimension.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Weakest dimension
                </p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-stone-900">{dimension.label}</span>
                  <span className="text-lg font-semibold text-stone-950">
                    {dimension.score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-[rgba(72,52,40,0.1)] bg-[rgba(255,252,247,0.62)] p-4 text-sm text-stone-700">
            Check your AEO score at AEOSpark.com
          </div>
        </div>
      </div>

      {status ? <p className="text-sm text-stone-700">{status}</p> : null}
    </section>
  );
}
