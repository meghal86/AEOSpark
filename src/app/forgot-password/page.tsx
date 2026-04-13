import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { PageUtilityNav } from "@/components/page-utility-nav";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10">
      <PageUtilityNav />

      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
          Password recovery
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
          Reset your password
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Enter the email on your AEOSpark account and we&apos;ll send you a secure link to set a
          new password.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Send reset link
            </p>
            <div className="mt-4">
              <ForgotPasswordForm />
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Need a different route?
            </p>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-stone-700">
              <p>
                If you created your account with an email link instead of a password, you can still
                use password recovery to set one now.
              </p>
              <p>
                If you remember your password, go back to{" "}
                <Link className="font-semibold text-stone-950 underline" href="/sign-in">
                  sign in
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
