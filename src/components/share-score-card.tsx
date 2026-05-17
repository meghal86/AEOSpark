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
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="ui-kicker">Share</span>
          <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
            Shareable score card.
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn-secondary inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-medium transition"
            onClick={downloadCard}
            type="button"
          >
            Download PNG
          </button>
          <button
            className="btn-accent inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition"
            onClick={shareOnLinkedIn}
            type="button"
          >
            Share on LinkedIn →
          </button>
        </div>
      </div>

      <div
        className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]"
        ref={ref}
      >
        <div className="bg-[var(--surface-muted)] p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            AEOSpark · Score card
          </p>
          <div className="mt-8 flex items-end justify-between gap-6">
            <div>
              <h3 className="max-w-xs font-display text-4xl tracking-tight text-[var(--foreground)]">
                {props.companyName}
              </h3>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                {props.url}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.12em] ${tone.className}`}
              >
                {tone.label}
              </p>
              <p className="font-display text-7xl tracking-tight text-[var(--foreground)]">
                {props.overallScore}
              </p>
            </div>
          </div>

          <dl className="mt-10 grid gap-0">
            {props.weakestDimensions.map((dimension) => (
              <div
                key={dimension.label}
                className="flex items-center justify-between border-t border-[var(--border)] py-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                  Weakest · {dimension.label}
                </dt>
                <dd className="font-display text-2xl tracking-tight text-[var(--foreground)]">
                  {dimension.score}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 border-t border-[var(--border)] pt-5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
            aeospark.com
          </div>
        </div>
      </div>

      {status ? (
        <p className="mt-4 text-sm text-[var(--foreground-muted)]">{status}</p>
      ) : null}
    </section>
  );
}
