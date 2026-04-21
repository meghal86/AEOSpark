import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountAccessForm } from "@/components/account-access-form";
import { PasswordSignInForm } from "@/components/password-sign-in-form";
import { SiteHeader } from "@/components/site-header";
import { createServerAuthClient } from "@/lib/supabase-auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    redirect("/account");
  }

  const resolved = await searchParams;
  const status = Array.isArray(resolved.status) ? resolved.status[0] : resolved.status;
  const showSignedOutBanner = status === "signed-out";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10">
      <SiteHeader minimal />

      {showSignedOutBanner && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-[rgba(232,247,240,0.92)] px-5 py-4 text-sm font-semibold text-emerald-900">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          You have been signed out successfully.
        </div>
      )}

      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
          Sign in
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
          Access your AEOSpark account
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Sign in with your password to access your reports, downloads, and account history.
          If you prefer, you can still request a secure email link below.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Password sign in
            </p>
            <div className="mt-4">
              <PasswordSignInForm />
            </div>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              Forgot your password?{" "}
              <Link className="font-semibold text-stone-950 underline" href="/forgot-password">
                Reset it here
              </Link>
            </p>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Email link instead
            </p>
            <div className="mt-4">
              <AccountAccessForm submitLabel="Send sign-in link →" />
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-stone-700">
          First time here?{" "}
          <Link className="font-semibold text-stone-950 underline" href="/sign-up">
            Create your account
          </Link>
        </p>
      </section>
    </main>
  );
}
