import { SiteHeader } from "@/components/site-header";

export default function MonitorPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader />

      <section className="app-fade-up pt-16 pb-24 md:pt-24">
        <span className="ui-kicker">Client portal</span>
        <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
          Coming soon.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">
          Continuous citation monitoring and weekly client reports will live
          here. Until then, email{" "}
          <a
            className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
            href="mailto:hello@aeospark.com"
          >
            hello@aeospark.com
          </a>{" "}
          for access requests.
        </p>
      </section>
    </main>
  );
}
