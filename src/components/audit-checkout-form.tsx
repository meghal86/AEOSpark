"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [companyName, setCompanyName] = useState(props.companyName);
  const [website, setWebsite] = useState(props.website);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(status: "paid" | "failed") {
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyName,
          email,
          name,
          scoreId: props.scoreId,
          status,
          website,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        orderId?: string;
      };

      if (!response.ok || !payload.orderId) {
        throw new Error(payload.error || "Checkout failed.");
      }

      if (status === "paid") {
        router.push(`/confirmation?order=${payload.orderId}`);
      } else {
        setError(
          "Card declined. This is the mock failure path from the user flow. No page reload required.",
        );
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create the order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-5 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
          Screen 3
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Audit checkout
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-100/88">
          One payment. Audit delivered within 24 hours.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3">
          <input
            className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-sky-400"
            onChange={(event) => setName(event.target.value)}
            placeholder="Buyer name"
            value={name}
          />
          <input
            className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-sky-400"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Business email"
            type="email"
            value={email}
          />
          <input
            className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-sky-400"
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Company name"
            value={companyName}
          />
          <input
            className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none focus:border-sky-400"
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="Website"
            value={website}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950 shadow-[0_12px_35px_rgba(255,255,255,0.16)] transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => submit("paid")}
              type="button"
            >
              {isSubmitting ? "Processing..." : "Pay $2,500"}
            </button>
            <button
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => submit("failed")}
              type="button"
            >
              Simulate declined card
            </button>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/80">
            Included
          </p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-100/88">
            <li>50-page crawl</li>
            <li>25-query citation baseline</li>
            <li>Competitor comparison</li>
            <li>Audit PDF + strategy call</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
