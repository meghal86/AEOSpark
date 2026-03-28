import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountAccessForm } from "@/components/account-access-form";
import { PageUtilityNav } from "@/components/page-utility-nav";
import { listDeliveredReportsByEmail } from "@/lib/audit-delivery";
import { formatDate } from "@/lib/format";
import { createServerAuthClient } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

async function signOut() {
  "use server";

  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/account");
}

export default async function AccountPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10">
        <PageUtilityNav />
        <section className="surface-panel rounded-[2.5rem] p-8">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
            Report access
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
            Access your reports
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
            Enter the email you used at checkout and we&apos;ll send a secure magic link to
            access your audit reports.
          </p>

          <div className="mt-8 max-w-xl">
            <AccountAccessForm />
          </div>
        </section>
      </main>
    );
  }

  const reports = await listDeliveredReportsByEmail(user.email);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageUtilityNav />
        <form action={signOut}>
          <button
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </div>

      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
          Buyer account
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
          Your delivered reports
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
          Signed in as <span className="font-semibold text-stone-950">{user.email}</span>.
        </p>

        {reports.length ? (
          <div className="mt-8 grid gap-4">
            {reports.map((item) => (
              <article
                className="surface-card grid gap-4 rounded-[2rem] p-6 md:grid-cols-[1fr_auto]"
                key={item.orderId}
              >
                <div className="grid gap-3">
                  <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
                    {item.domain}
                  </p>
                  <h2 className="text-2xl font-semibold text-stone-950">
                    AI visibility audit report
                  </h2>
                  <p className="text-sm leading-7 text-stone-700">
                    Delivered on {formatDate(item.deliveredAt)}.
                    {item.report
                      ? ` Claude cited you in ${item.report.claudeCited}/20 queries and ChatGPT cited you in ${item.report.chatgptCited}/20.`
                      : " Your report is ready to review."}
                  </p>
                </div>

                <div className="grid gap-3 md:min-w-56">
                  <Link
                    className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
                    href={`/report/${item.reference}`}
                  >
                    View Report →
                  </Link>
                  {item.reportUrl ? (
                    <Link
                      className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
                      href={item.reportUrl}
                      target="_blank"
                    >
                      Download PDF →
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.8rem] border border-stone-200 bg-stone-50/80 px-5 py-5 text-sm leading-7 text-stone-700">
            No reports yet. Your audit will appear here when ready.
          </div>
        )}
      </section>
    </main>
  );
}
