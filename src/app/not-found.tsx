import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
        AEOSpark
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-white">
        The requested record could not be found.
      </h1>
      <p className="max-w-2xl text-base leading-7 text-slate-300">
        If you refreshed a score or order from a different environment, it may not
        exist in the local JSON store yet.
      </p>
      <Link
        className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
        href="/"
      >
        Back to home
      </Link>
    </main>
  );
}
