import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate } from "@/lib/format";
import { getScoreBySlug } from "@/lib/storage";
import type { ScoreDimension } from "@/lib/types";

export default async function PublicScorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const score = await getScoreBySlug(slug);

  if (!score) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10">
      <section className="surface-panel rounded-[2.2rem]">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
          Public score
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-stone-950 md:text-5xl">
          {score.companyName}
        </h1>
        <p className="mt-3 text-sm text-stone-600">Published {formatDate(score.createdAt)}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="surface-card rounded-3xl p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Overall</p>
            <p className="mt-3 text-6xl font-semibold text-stone-950">{score.overallScore}</p>
          </div>
          {score.dimensions.slice(0, 2).map((dimension: ScoreDimension) => (
            <div
              className="surface-card rounded-3xl p-5"
              key={dimension.key}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                {dimension.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-stone-950">
                {dimension.score}/{dimension.weight}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold transition"
          href={`/score/${score.id}`}
        >
          View full results
        </Link>
        <Link
          className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
          href="/"
        >
          Check another site
        </Link>
      </section>
    </main>
  );
}
