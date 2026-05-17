import Link from "next/link";
import { redirect } from "next/navigation";

import { RemeasureButton } from "@/components/remeasure-button";
import { SiteHeader } from "@/components/site-header";
import { getUserProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerAuthClient } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";

  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/sign-in?status=signed-out");
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function dateLabel(date: Date | null | undefined) {
  if (!date) return "Not yet";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function AccountPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/sign-in");
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: profile.userId }, { email: profile.email }],
      status: "delivered",
    },
    include: {
      scoreHistory: { orderBy: { runNumber: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const month = monthStart(now);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader />

      <section className="app-fade-up pt-14 pb-24">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[var(--border)] pb-8">
          <div>
            <span className="ui-kicker">Account</span>
            <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
              Measurement history.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--foreground-muted)]">
              Each paid audit includes a 90-day window with three monthly
              re-measurements. Track whether your citation share improves after
              implementation.
            </p>
          </div>

          <form action={signOut}>
            <button
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] px-5 text-sm font-semibold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 text-sm md:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <p className="ui-kicker">Email</p>
            <p className="mt-3 font-medium">{profile.email}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <p className="ui-kicker">Name</p>
            <p className="mt-3 font-medium">{profile.name || "Not set"}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <p className="ui-kicker">Company</p>
            <p className="mt-3 font-medium">{profile.company || "Not set"}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
            <p className="ui-kicker">Website</p>
            <p className="mt-3 font-medium">{profile.website || "Not set"}</p>
          </div>
        </div>

        <div className="mt-14 grid gap-8">
          {orders.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-8">
              <span className="ui-kicker">Documents</span>
              <h2 className="mt-4 text-3xl tracking-tight">No delivered audits yet.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--foreground-muted)]">
                Your paid audit reports and monthly re-measurements will appear
                here after delivery.
              </p>
            </div>
          ) : null}

          {orders.map((order) => {
            const windowEnds =
              order.measurementWindowEndsAt ??
              addDays(order.deliveredAt ?? order.createdAt, 90);
            const histories = order.scoreHistory;
            const hasThisMonth = histories.some(
              (history) => history.runNumber > 1 && history.createdAt >= month,
            );
            const disabledReason =
              windowEnds < now
                ? "The 90-day measurement window has ended."
                : histories.length >= 4
                  ? "All three monthly re-measurements have already been used."
                  : hasThisMonth
                    ? "This audit has already been re-measured this month."
                    : undefined;

            return (
              <article
                className="rounded-[var(--radius-lg)] border border-[var(--border)] p-6 md:p-8"
                key={order.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div>
                    <span className="ui-kicker">Audit</span>
                    <h2 className="mt-3 text-3xl tracking-tight">
                      {domainFromUrl(order.url)}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
                      Delivered {dateLabel(order.deliveredAt)} · measurement
                      window ends {dateLabel(windowEnds)}
                    </p>
                  </div>

                  <RemeasureButton
                    disabled={Boolean(disabledReason)}
                    disabledReason={disabledReason}
                    orderId={order.id}
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    className="btn-accent inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
                    href={`/report/${order.stripePaymentIntentId || order.id}`}
                  >
                    View report →
                  </Link>
                  <Link
                    className="btn-secondary inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
                    href={`/api/reports/${order.stripePaymentIntentId || order.id}/download`}
                    target="_blank"
                  >
                    Download PDF →
                  </Link>
                </div>

                <div className="mt-8 grid gap-4">
                  {histories.length === 0 ? (
                    <p className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                      Baseline score history will appear after report delivery
                      data is synced.
                    </p>
                  ) : null}

                  {histories.map((history) => (
                    <div
                      className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--border)] p-4 md:grid-cols-[auto_1fr_auto]"
                      key={history.id}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-sm font-semibold">
                        {history.runNumber}
                      </div>
                      <div>
                        <p className="font-medium">
                          {history.runNumber === 1
                            ? "Baseline audit"
                            : `Monthly re-measurement ${history.runNumber - 1}`}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {dateLabel(history.createdAt)}
                        </p>
                      </div>
                      <dl className="grid grid-cols-2 gap-4 text-sm md:min-w-[280px]">
                        <div>
                          <dt className="text-[var(--foreground-muted)]">Claude</dt>
                          <dd className="mt-1 font-semibold">
                            {Math.round(history.citationClaude)}%
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[var(--foreground-muted)]">ChatGPT</dt>
                          <dd className="mt-1 font-semibold">
                            {Math.round(history.citationChatgpt)}%
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
