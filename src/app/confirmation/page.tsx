import Link from "next/link";
import { notFound } from "next/navigation";

import { formatCurrency, formatDate } from "@/lib/format";
import { getOrderById } from "@/lib/storage";

function decodeValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const orderId = decodeValue(resolved.order);
  const order = orderId ? await getOrderById(orderId) : undefined;

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
      <section className="grid gap-6 rounded-[2.2rem] border border-emerald-400/20 bg-emerald-500/10 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
            Screen 5
          </span>
          <span className="text-sm text-emerald-100/75">
            Payment confirmed on {formatDate(order.createdAt)}
          </span>
        </div>

        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Audit booked successfully
          </h1>
          <p className="max-w-3xl text-base leading-7 text-emerald-50/85">
            The confirmation flow is active. The order has been stored, the
            `audit.requested` job was queued, and the portal record is ready for the
            implementation team.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            Order details
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <p>
              <span className="font-semibold text-white">Company:</span>{" "}
              {order.companyName || order.website}
            </p>
            <p>
              <span className="font-semibold text-white">Email:</span> {order.email}
            </p>
            <p>
              <span className="font-semibold text-white">Website:</span>{" "}
              {order.website}
            </p>
            <p>
              <span className="font-semibold text-white">Amount:</span>{" "}
              {formatCurrency(order.amount)}
            </p>
            <p>
              <span className="font-semibold text-white">Status:</span> {order.status}
            </p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
            What happens next
          </p>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-300">
            <p>1. Deep crawl and citation baseline job begins.</p>
            <p>2. Audit PDF delivery target is within 24 hours.</p>
            <p>3. Strategy call is the retainer pitch moment.</p>
            <p>4. The monitor portal is already staged for client-facing reporting.</p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur md:grid-cols-2">
        <Link
          className="inline-flex h-14 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
          href="https://calendly.com"
          rel="noreferrer"
          target="_blank"
        >
          Book strategy call
        </Link>

        {order.clientId ? (
          <Link
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/12 px-4 text-sm font-semibold text-white transition hover:border-sky-300/50"
            href={`/monitor/${order.clientId}`}
          >
            Open client portal
          </Link>
        ) : null}
      </section>
    </main>
  );
}
