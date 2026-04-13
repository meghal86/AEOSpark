import Link from "next/link";

import { AccountAccessForm } from "@/components/account-access-form";
import { PageUtilityNav } from "@/components/page-utility-nav";
import { PasswordSignUpForm } from "@/components/password-sign-up-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10">
      <PageUtilityNav />

      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
          Create account
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
          Save your reports to your account
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Create your AEOSpark account with a password or a secure email link. Once you&apos;re in,
          your paid audits stay available under one account.
        </p>

        <div className="mt-6 grid gap-3 text-sm leading-7 text-stone-700 md:grid-cols-3">
          <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50/70 p-4">
            <p className="font-semibold text-stone-950">One login</p>
            <p className="mt-2">All delivered reports stay under the same buyer account.</p>
          </div>
          <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50/70 p-4">
            <p className="font-semibold text-stone-950">Choose your access method</p>
            <p className="mt-2">Use a password for standard sign-in or fall back to a secure email link.</p>
          </div>
          <div className="rounded-[1.6rem] border border-stone-200 bg-stone-50/70 p-4">
            <p className="font-semibold text-stone-950">Buyer ownership</p>
            <p className="mt-2">Your reports, PDFs, and audit history stay attached to your email.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Create account with password
            </p>
            <div className="mt-4">
              <PasswordSignUpForm />
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Email link instead
            </p>
            <div className="mt-4">
              <AccountAccessForm
                mode="sign-up"
                submitLabel="Create with email link →"
                successMessage="Check your email for the account access link."
              />
            </div>
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-stone-700">
          Already have access?{" "}
          <Link className="font-semibold text-stone-950 underline" href="/sign-in">
            Sign in
          </Link>
          {" "}or{" "}
          <Link className="font-semibold text-stone-950 underline" href="/forgot-password">
            reset your password
          </Link>
        </p>
      </section>
    </main>
  );
}
