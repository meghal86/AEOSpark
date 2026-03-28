export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10 md:px-10">
      <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
        Privacy
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
        Privacy policy
      </h1>
      <div className="grid gap-4 text-base leading-7 text-stone-700">
        <p>
          AEOSpark collects the information needed to run website scores,
          process audit purchases, and deliver reports. That includes submitted
          URLs, contact details provided in forms, and payment metadata handled
          through Stripe.
        </p>
        <p>
          We do not store card details. Payment information is processed by
          Stripe. Audit delivery and report access may use Supabase, Resend, and
          other infrastructure providers acting on our behalf.
        </p>
        <p>
          Questions about privacy can be sent to{" "}
          <a className="font-semibold text-stone-950" href="mailto:hello@aeospark.com">
            hello@aeospark.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
