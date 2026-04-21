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
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="surface-panel relative grid gap-5 rounded-[2.2rem] p-6 lg:p-7">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(124,85,68,0.4)] to-transparent" />
        <div>
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Buyer details
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-stone-950">
            Get your AI visibility audit
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-700">
            This purchase unlocks the exact prompts, competitor examples, and
            implementation priorities behind the score.
          </p>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Full name
          <input
            className="input-field h-14 rounded-[1.35rem] px-4 text-sm"
            onChange={(event) => setName(event.target.value)}
            placeholder="Buyer name"
            value={name}
          />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Work email
          <input
            className="input-field h-14 rounded-[1.35rem] px-4 text-sm"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Business email"
            type="email"
            value={email}
          />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Website to audit
          <input
            className="input-field h-14 rounded-[1.35rem] px-4 text-sm"
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="Website"
            value={website}
          />
          </label>

          <button
            className="btn-primary mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-[1.35rem] text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => submit()}
            type="button"
          >
            {isSubmitting && <LoadingSpinner size="sm" className="text-white/70" />}
            {isSubmitting ? "Redirecting to checkout..." : "Get My Full Audit — $997"}
          </button>

          {error ? <p className="status-danger text-sm">{error}</p> : null}
        </div>

        <div className="surface-card grid gap-3 rounded-[1.8rem] p-5">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
            Payment area
          </p>
          <div className="rounded-[1.4rem] border border-[rgba(72,52,40,0.12)] bg-[rgba(255,252,247,0.72)] px-4 py-6 text-sm leading-6 text-stone-700">
            Card entry, Apple Pay, and Google Pay are handled by Stripe-hosted
            Checkout after you submit this form.
          </div>
          <div className="ui-chip rounded-[1.2rem] px-4 py-3 text-sm font-semibold">
            SSL secured checkout
          </div>
        </div>

        <div className="surface-card grid gap-3 rounded-[1.8rem] p-5">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
            What leadership gets answered
          </p>
          <div className="grid gap-2 text-sm leading-7 text-stone-700">
            {buyerQuestions.map((question) => (
              <p key={question}>• {question}</p>
            ))}
          </div>
        </div>

        <p className="max-w-xl text-xs leading-6 text-stone-600">
          Stripe handles payment security. AEOSpark only collects the audit
          details needed to create the checkout session.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="surface-card rounded-[1.8rem] p-5">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
            Order summary
          </p>
          <div className="mt-4 grid gap-3 text-sm text-stone-700">
            <div className="flex items-center justify-between gap-3">
              <span>Full AEO Audit</span>
              <span className="font-semibold text-stone-950">$997</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Final report</span>
              <span>Within 24hrs</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Tax</span>
              <span>$0</span>
            </div>
            <div className="border-t border-[rgba(72,52,40,0.1)] pt-3 flex items-center justify-between gap-3">
              <span className="font-semibold text-stone-950">Total</span>
              <span className="text-lg font-bold text-stone-950">$997</span>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-[1.8rem] p-5">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
            What&apos;s included
          </p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-700">
            <li>✓ Executive PDF audit with buyer-intent query findings</li>
            <li>✓ Citation baseline across major AI assistants</li>
            <li>✓ Named competitor comparison with proof excerpts</li>
            <li>✓ Highest-impact fixes ranked by expected impact</li>
            <li>✓ 30/60/90-day implementation roadmap</li>
            <li>✓ 30-minute strategy call after delivery</li>
          </ul>
          <p className="mt-4 text-xs leading-6 text-stone-600">
            This is not the score page repackaged. The deliverable is a separate
            report with prompt-by-prompt findings, competitor examples, and a
            ranked implementation plan.
          </p>
        </div>

        <div className="surface-card rounded-[1.8rem] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Audit guarantee
          </p>
          <div className="mt-4 rounded-[1.4rem] border border-emerald-200/80 bg-[rgba(232,247,240,0.92)] px-4 py-4 text-sm leading-7 text-emerald-900">
            If this audit does not show you at least three specific, actionable
            changes to improve AI visibility, we will refund you in full.
          </div>
        </div>
      </div>
    </section>
  );
}
