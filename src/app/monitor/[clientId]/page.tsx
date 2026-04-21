import { SiteHeader } from "@/components/site-header";

export default function MonitorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10 md:px-10">
      <SiteHeader />
      <section className="surface-panel app-fade-up grid gap-4 rounded-[2rem] p-6">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
          Client portal
        </p>
        <h1 className="text-4xl font-semibold text-stone-950 md:text-5xl">
          Client portal coming soon
        </h1>
        <p className="max-w-2xl text-base leading-7 text-stone-700">
          Contact hello@aeospark.com
        </p>
      </section>
    </main>
  );
}
