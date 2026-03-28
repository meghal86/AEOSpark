import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
        AEOSpark
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
        The requested record could not be found.
      </h1>
      <p className="max-w-2xl text-base leading-7 text-stone-700">
        This score or report link may have expired, or the record is no longer
        available. Run a new score to get started again.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold transition"
          href="/"
        >
          Run a new score
        </Link>
        <Link
          className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
          href="/"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
