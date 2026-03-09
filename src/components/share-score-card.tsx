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
    <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Viral loop
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Shareable score card
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/12 px-4 text-sm font-semibold text-white transition hover:border-sky-300/50"
            onClick={downloadCard}
            type="button"
          >
            Download PNG
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-sky-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            onClick={shareOnLinkedIn}
            type="button"
          >
            Share on LinkedIn
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[1.75rem] border border-white/10"
        ref={ref}
      >
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.35),_transparent_32%),linear-gradient(135deg,#08111f,#0f172a_45%,#112948)] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">
            AEOSpark Score Card
          </p>
          <div className="mt-6 flex items-end justify-between gap-6">
            <div>
              <h3 className="max-w-xs text-3xl font-semibold text-white">
                {props.companyName}
              </h3>
              <p className="mt-2 text-sm text-slate-300">{props.url}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold uppercase ${tone.className}`}>
                {tone.label}
              </p>
              <p className="text-6xl font-semibold text-white">
                {props.overallScore}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {props.weakestDimensions.map((dimension) => (
              <div
                className="rounded-3xl border border-white/10 bg-black/20 p-4"
                key={dimension.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Weakest dimension
                </p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-white">{dimension.label}</span>
                  <span className="text-lg font-semibold text-white">
                    {dimension.score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-4 text-sm text-slate-200">
            Check your AEO score at AEOSpark.com
          </div>
        </div>
      </div>

      {status ? <p className="text-sm text-sky-100">{status}</p> : null}
    </section>
  );
}
