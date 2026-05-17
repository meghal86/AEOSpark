"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/loading-spinner";

export function AuditCheckoutForm(props: {
  companyName: string;
  defaultEmail: string;
  defaultName: string;
  scoreId?: string;
  website: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(props.defaultName);
  const [email, setEmail] = useState(props.defaultEmail);
  const [website, setWebsite] = useState(props.website);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const buyerQuestions = [
    "Which prompts are we currently losing to competitors?",
    "Which pages need to change first to increase citations?",
    "What should the team do in the next 30, 60, and 90 days?",
  ];

  async function submit() {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          scoreId: props.scoreId,
          url: website,
        }),
      });

      const payload = (await response.json()) as {
        data?: {
          checkoutUrl?: string;
          existingOrder?: boolean;
          redirectUrl?: string;
          status?: string;
        };
        error?: string;
      };

      if (!response.ok || (!payload.data?.checkoutUrl && !payload.data?.redirectUrl)) {
        throw new Error(payload.error || "Checkout failed.");
      }

      if (payload.data?.existingOrder && payload.data.redirectUrl) {
        router.push(payload.data.redirectUrl);
        return;
      }

      if (!payload.data?.checkoutUrl) {
        throw new Error("Checkout session did not return a redirect URL.");
      }

      router.push(payload.data.checkoutUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to start checkout.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      {/* Form */}
      <div className="grid gap-8">
        <div className="grid gap-3">
          <span className="ui-kicker">Your details</span>
          <h2 className="text-3xl tracking-tight md:text-4xl">Checkout</h2>
          <p className="text-base leading-relaxed">
            Three fields to personalize the audit. Payment is handled by Stripe
            on the next step.
          </p>
        </div>

        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Full name
            <input
              className="input-field h-12 px-4 text-sm"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              value={name}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Work email
            <input
              className="input-field h-12 px-4 text-sm"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
            Website to audit
            <input
              className="input-field h-12 px-4 text-sm"
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="yourcompany.com"
              value={website}
            />
          </label>

          <button
            className="btn-accent mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => submit()}
            type="button"
          >
            {isSubmitting && <LoadingSpinner size="sm" className="text-white/80" />}
            {isSubmitting ? "Redirecting to Stripe…" : "Continue to payment — $997"}
          </button>

          {error ? <p className="status-danger text-sm">{error}</p> : null}

          <p className="text-xs leading-relaxed text-[var(--foreground-subtle)]">
            Secure checkout powered by Stripe. Card, Apple Pay, and Google Pay
            are available on the next step. AEOSpark only stores the details
            needed to run your audit.
          </p>
        </div>
      </div>

      {/* Summary */}
      <aside className="grid gap-10 lg:sticky lg:top-10">
        <div className="grid gap-5">
          <span className="ui-kicker">Order summary</span>
          <dl className="grid gap-3 text-sm">
            <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-3">
              <dt className="text-[var(--foreground-muted)]">Full AEO Audit</dt>
              <dd className="font-medium text-[var(--foreground)]">$997</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-3">
              <dt className="text-[var(--foreground-muted)]">Delivery</dt>
              <dd className="text-[var(--foreground-muted)]">Within 24 hours</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-3">
              <dt className="text-[var(--foreground-muted)]">Tax</dt>
              <dd className="text-[var(--foreground-muted)]">$0</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 pt-1">
              <dt className="font-medium text-[var(--foreground)]">Total</dt>
              <dd className="font-display text-2xl tracking-tight text-[var(--foreground)]">
                $997
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4">
          <span className="ui-kicker">What&rsquo;s included</span>
          <ul className="grid gap-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
            {[
              "Executive PDF audit with buyer-intent query findings",
              "Citation baseline across major AI assistants",
              "Named competitor comparison with proof excerpts",
              "Highest-impact fixes ranked by expected impact",
              "30/60/90-day implementation roadmap",
              "90-day measurement window with three monthly re-runs",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <svg
                  className="mt-[3px] h-4 w-4 flex-shrink-0 text-[var(--accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-3">
          <span className="ui-kicker">Leadership answers</span>
          <ul className="grid gap-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            {buyerQuestions.map((q) => (
              <li key={q}>— {q}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--accent-soft)] p-5 text-sm leading-relaxed text-[var(--accent-deep)]">
          <strong className="font-semibold">Audit guarantee.</strong>{" "}
          If the report doesn&rsquo;t show you at least three specific, actionable
          changes to improve AI visibility, we refund in full.
        </div>
      </aside>
    </div>
  );
}
