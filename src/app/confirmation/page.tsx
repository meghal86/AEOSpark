import { notFound } from "next/navigation";

import { AccountAccessForm } from "@/components/account-access-form";
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
    ? "Payment is confirmed and the audit is being initialized now. The record sync usually completes within a minute."
    : "Your order record is confirmed and the audit workflow is already running.";
  const purchasedOutcome = [
    "A prompt-by-prompt visibility map showing exactly where competitors are being cited instead of you.",
    "A ranked fix list tied to authority, pricing, structure, and citation-readiness gaps.",
    "A 30-minute strategy walkthrough focused on what to implement first and what can wait.",
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
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

      <section className="surface-panel app-fade-up grid gap-6 rounded-[2.5rem] p-6 lg:grid-cols-[1.18fr_0.82fr] lg:p-8">
        <div className="grid gap-6 self-start">
          <div className="flex flex-wrap items-center gap-3">
            <span className="ui-chip status-success rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
              Audit booked
            </span>
            <span className="text-sm text-stone-600">
              Payment confirmed on {formatDate(displayOrder.createdAt)}
            </span>
          </div>

          <div className="grid gap-3">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
              Your AI visibility audit is officially underway.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-700">
              We&apos;re preparing the audit for{" "}
              <span className="font-semibold text-stone-950">{orderDomain}</span>.
              Over the next 24 hours we&apos;ll benchmark citation visibility,
              analyze competitor mentions, and assemble the full report package.
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm leading-7 text-emerald-900">
            {syncMessage}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Citation baseline",
                detail:
                  "We are checking how often major AI assistants cite you versus competitors across real buyer-intent prompts.",
              },
              {
                title: "Deep site audit",
                detail:
                  "We review pricing visibility, structure, authority signals, and which pages are currently citation-ready.",
              },
              {
                title: "Executive report",
                detail:
                  "You will receive a polished PDF with specific findings, exact gaps, and the highest-leverage fixes to make first.",
              },
              {
                title: "Strategy walkthrough",
                detail:
                  "Book the call now if you want the report review on your calendar immediately after delivery.",
              },
            ].map((item, index) => (
              <article className="surface-card rounded-[1.8rem] p-5" key={item.title}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-stone-50 text-sm font-semibold text-stone-900">
                    {index + 1}
                  </div>
                  <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
                    {item.title}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-7 text-stone-700">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="grid gap-4 self-start">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
              Order summary
            </p>

            <div className="mt-5 grid gap-4">
              <div className="flex items-start justify-between gap-6 border-b border-stone-200 pb-4">
                <div>
                  <p className="text-sm font-semibold text-stone-950">Website</p>
                  <p className="mt-1 text-sm text-stone-600">{orderDomain}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-stone-950">Amount</p>
                  <p className="mt-1 text-lg font-semibold text-stone-950">
                    {formatCurrency(displayOrder.amount)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-stone-700">
                <div className="flex items-center justify-between gap-4">
                  <span>Status</span>
                  <span className="font-semibold capitalize text-stone-950">
                    {displayOrder.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Final report</span>
                  <span className="font-semibold text-stone-950">Delivered within 24 hours</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Reference</span>
                  <span className="font-semibold text-stone-950">
                    {compactReference(displayOrder.label)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
              What arrives in the report
            </p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-stone-700">
              {purchasedOutcome.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <div className="mt-5 rounded-[1.4rem] border border-[rgba(72,52,40,0.12)] bg-[rgba(255,252,247,0.72)] px-4 py-4 text-sm leading-7 text-stone-700">
              What you see on this page is only the order confirmation. The
              delivered report contains the prompt-level findings, competitor
              examples, page-by-page analysis, and implementation roadmap.
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em]">
              Support
            </p>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              If you need anything before the report arrives, email{" "}
              <span className="font-semibold text-stone-950">hello@aeospark.com</span>{" "}
              and include your order reference.
            </p>
            <p className="mt-3 text-sm leading-7 text-stone-700">
              Want to access this report anytime? It will also be available at{" "}
              <span className="font-semibold text-stone-950">aeospark.com/account</span>{" "}
              using the email you provided at checkout.
            </p>
          </div>
        </aside>
      </section>

      {appEnv.calendlyUrl ? (
        <section className="surface-panel rounded-[2.2rem] p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div className="grid gap-2">
              <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
                Next step
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
                Reserve your strategy walkthrough
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-stone-700">
                Book now if you want the debrief already on your calendar. We&apos;ll
                use the session to walk through findings, competitor gaps, and the
                fastest path to measurable AI visibility gains.
              </p>
            </div>

            <a
              className="btn-primary inline-flex h-14 items-center justify-center rounded-2xl px-8 text-sm font-bold transition"
              href={appEnv.calendlyUrl}
              rel="noreferrer"
              target="_blank"
            >
              Book Your 30-Min Strategy Call
            </a>
          </div>
        </section>
      ) : null}

      <section className="surface-panel rounded-[2.2rem] p-6 md:p-8">
        <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div className="grid gap-2">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
              Save this purchase to your account
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Claim your buyer account now
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-700">
              Use the same email from checkout and we&apos;ll send a magic link so this report
              is always available in your AEOSpark account. That way you won&apos;t be asked to
              pay again for the same audit just to find the report later.
            </p>
          </div>

          <div className="surface-card rounded-[1.8rem] p-5">
            <AccountAccessForm
              defaultEmail={buyerEmail}
              submitLabel="Claim my account →"
              successMessage="Check your email for the access link. This audit will appear in your account."
            />
          </div>
        </div>
      </section>
    </main>
  );
}
