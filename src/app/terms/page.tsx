export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10 md:px-10">
      <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
        Terms
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
        Terms of service
      </h1>
      <div className="grid gap-4 text-base leading-7 text-stone-700">
        <p>
          AEOSpark provides AI visibility analysis and audit deliverables for
          informational and strategic planning purposes. We do not guarantee AI
          citations, rankings, or traffic outcomes.
        </p>
        <p>
          Paid audits are delivered based on the information available from your
          submitted website, search engines, and AI provider responses at the
          time of analysis. Delivery timelines may vary if third-party services
          are unavailable.
        </p>
        <p>
          Questions about these terms can be sent to{" "}
          <a className="font-semibold text-stone-950" href="mailto:hello@aeospark.com">
            hello@aeospark.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
