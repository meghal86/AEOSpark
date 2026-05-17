import { notFound } from "next/navigation";
import Link from "next/link";

import { BuyerSessionSync } from "@/components/buyer-session-sync";
import { SiteHeader } from "@/components/site-header";
import { appEnv } from "@/lib/env";
import { formatCurrency, formatDate } from "@/lib/format";
import { getStripe } from "@/lib/stripe";
import { getOrderByReference } from "@/lib/storage";

function decodeValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

function displayDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function compactReference(value: string) {
  if (value.length <= 28) {
    return value;
  }

  return `${value.slice(0, 14)}...${value.slice(-8)}`;
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const orderId = decodeValue(resolved.order);
  let reference = orderId;
  let provisionalOrder:
    | {
        createdAt: string;
        email: string;
        name: string;
        website: string;
        amount: number;
        status: string;
        label: string;
      }
    | undefined;

  if (reference.startsWith("cs_")) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(reference);
      const amountTotal =
        typeof session.amount_total === "number" ? session.amount_total / 100 : 997;

      provisionalOrder = {
        createdAt: new Date().toISOString(),
        email: session.customer_details?.email || "",
        name: session.metadata?.name || session.customer_details?.name || "there",
        website: session.metadata?.url || "your site",
        amount: amountTotal,
        status: session.payment_status === "paid" ? "processing" : session.status ?? "pending",
        label: reference,
      };

      reference =
        typeof session.payment_intent === "string" ? session.payment_intent : reference;
    } catch {
      // Fall through to direct lookup.
    }
  }

  const order = reference ? await getOrderByReference(reference) : undefined;

  if (!order && !provisionalOrder) {
    notFound();
  }

  const displayOrder = order
    ? {
        createdAt: order.createdAt,
        email: order.email,
        name: order.name,
        website: order.website,
        amount: order.amount,
        status: order.status,
        label: order.stripePaymentIntentId || order.id,
      }
    : provisionalOrder!;

  const orderDomain = displayDomain(displayOrder.website);
  const buyerEmail = displayOrder.email || order?.email || "";
  const syncMessage = !order
    ? "Payment confirmed. The audit is initializing now — the record usually syncs within a minute."
    : "Your order is confirmed and the audit workflow is already running.";

  const auditSteps = [
    {
      title: "Citation baseline",
      detail:
        "We measure how often Claude and ChatGPT cite you versus competitors across 20 real buyer-intent prompts.",
    },
    {
      title: "Deep site audit",
      detail:
        "Pricing visibility, structure, authority signals, and citation-readiness at the page level.",
    },
    {
      title: "Executive report",
      detail:
        "A PDF with the exact gaps, competitor examples, and the highest-leverage fixes ranked in order.",
    },
    {
      title: "90-day measurement window",
      detail:
        "Your account includes the baseline plus three monthly re-measurements so you can prove citation share is improving.",
    },
  ];
  const createAccountHref = `/sign-up?email=${encodeURIComponent(
    buyerEmail,
  )}&website=${encodeURIComponent(displayOrder.website)}&name=${encodeURIComponent(
    displayOrder.name || "",
  )}`;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-6 md:px-10 md:py-10">
      <BuyerSessionSync
        domain={orderDomain}
        email={buyerEmail}
        orderReference={displayOrder.label}
        reportUrl={order?.status === "delivered" ? `/report/${displayOrder.label}` : null}
        savedAt={new Date().toISOString()}
        status={
          displayOrder.status === "delivered"
            ? "delivered"
            : displayOrder.status === "processing"
              ? "processing"
              : "pending"
        }
      />
      <SiteHeader />

      <section className="app-fade-up pt-16 pb-16 md:pt-24">
        <span className="ui-kicker">Audit booked · {formatDate(displayOrder.createdAt)}</span>
        <h1 className="mt-4 max-w-3xl text-5xl tracking-tight md:text-6xl">
          Your audit is underway.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">
          We&rsquo;re preparing the audit for{" "}
          <span className="font-medium text-[var(--foreground)]">{orderDomain}</span>
          . Over the next 24 hours we&rsquo;ll benchmark citation visibility,
          analyze competitor mentions, and assemble the full report.
        </p>

        <div className="mt-8 inline-flex rounded-[var(--radius-md)] border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-5 py-3 text-sm leading-relaxed text-[var(--accent-deep)]">
          {syncMessage}
        </div>
      </section>

      <hr className="section-divider" />

      <section className="py-16 md:py-20">
        <div className="grid gap-2 md:grid-cols-[auto_1fr] md:gap-16">
          <span className="ui-kicker md:mt-2">Order summary</span>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
            <SummaryCell label="Website" value={orderDomain} />
            <SummaryCell label="Amount" value={formatCurrency(displayOrder.amount)} />
            <SummaryCell
              label="Status"
              value={displayOrder.status.charAt(0).toUpperCase() + displayOrder.status.slice(1)}
            />
            <SummaryCell label="Includes" value="90-day tracking" />
          </dl>
        </div>
      </section>

      <hr className="section-divider" />

      <section className="py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="md:max-w-xs">
            <span className="ui-kicker">What happens next</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              The audit pipeline.
            </h2>
          </div>

          <div className="grid gap-0">
            {auditSteps.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-[auto_1fr] items-start gap-8 border-t border-[var(--border)] py-6 last:border-b"
              >
                <span className="font-display text-2xl tracking-tight text-[var(--foreground-subtle)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-lg font-medium text-[var(--foreground)]">
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {appEnv.calendlyUrl ? (
        <>
          <hr className="section-divider" />
          <section className="py-16 md:py-20">
            <div className="grid gap-6 md:grid-cols-[1.1fr_auto] md:items-end md:gap-12">
              <div>
                <span className="ui-kicker">Next step</span>
                <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
                  Reserve your strategy walkthrough.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed">
                  Get the debrief on your calendar now. We&rsquo;ll use the
                  session to walk through findings, competitor gaps, and the
                  fastest path to measurable AI visibility gains.
                </p>
              </div>

              <a
                className="btn-accent inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-semibold transition md:h-14 md:px-8"
                href={appEnv.calendlyUrl}
                rel="noreferrer"
                target="_blank"
              >
                Book 30-min call →
              </a>
            </div>
          </section>
        </>
      ) : null}

      <hr className="section-divider" />

      <section className="py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div>
            <span className="ui-kicker">Save this to your account</span>
            <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">
              Claim your buyer account.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed">
              Create an AEOSpark login with the same email used at checkout.
              The report, PDF, and three monthly re-measurements will stay
              attached to this buyer account — no need to pay again just to
              find the same audit later.
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-muted)] p-6">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Buyer email
            </p>
            <p className="mt-2 break-all text-sm text-[var(--foreground-muted)]">
              {buyerEmail || "Use the same email from Stripe checkout."}
            </p>
            <div className="mt-6 grid gap-3">
              <Link
                className="btn-accent inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-semibold transition"
                href={createAccountHref}
              >
                Create account →
              </Link>
              <Link
                className="btn-secondary inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] px-6 text-sm font-semibold transition"
                href="/sign-in"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      <section className="py-10 text-sm text-[var(--foreground-muted)]">
        Reference:{" "}
        <span className="font-medium text-[var(--foreground)]">
          {compactReference(displayOrder.label)}
        </span>
        {" · "}
        Questions? Email{" "}
        <a
          className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
          href="mailto:hello@aeospark.com"
        >
          hello@aeospark.com
        </a>
      </section>
    </main>
  );
}

function SummaryCell(props: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
        {props.label}
      </dt>
      <dd className="mt-2 font-display text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
        {props.value}
      </dd>
    </div>
  );
}
