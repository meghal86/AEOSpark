import Link from "next/link";

import { AccountAccessForm } from "@/components/account-access-form";
import { PageUtilityNav } from "@/components/page-utility-nav";
import { PasswordSignInForm } from "@/components/password-sign-in-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10">
      <PageUtilityNav />

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
