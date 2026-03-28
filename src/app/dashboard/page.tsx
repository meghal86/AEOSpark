export default function DashboardPlaceholderPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-10 md:px-10">
      <section className="surface-panel grid gap-4">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
          Dashboard
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          Coming soon
        </h1>
        <p className="max-w-2xl text-base leading-7 text-stone-700">
          Client reporting will live here soon. For now, run a score, book an
          audit, or use your report access link to review completed findings.
        </p>
      </section>
    </main>
  );
}
