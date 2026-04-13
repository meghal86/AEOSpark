import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountAccessForm } from "@/components/account-access-form";
import { AccountTabs } from "@/components/account-tabs";
import { PageUtilityNav } from "@/components/page-utility-nav";
import { listDeliveredReportsByEmail } from "@/lib/audit-delivery";
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
            Sign in or create your account with the email you used at checkout. Use a password or a
            secure email link to keep your audit reports under one account.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
              href="/sign-in"
            >
              Sign in
            </Link>
            <Link
              className="btn-primary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
              href="/sign-up"
            >
              Create account
            </Link>
          </div>

          <div className="mt-8 max-w-xl">
            <AccountAccessForm submitLabel="Send access link →" />
          </div>
        </section>
      </main>
    );
  }

  const reports = await listDeliveredReportsByEmail(user.email);
  const metadata = (user.user_metadata || {}) as {
    fullName?: string;
    companyName?: string;
    website?: string;
  };

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

      <AccountTabs
        profile={{
          email: user.email,
          fullName: metadata.fullName || null,
          companyName: metadata.companyName || null,
          website: metadata.website || null,
        }}
        reports={reports}
      />
    </main>
  );
}
