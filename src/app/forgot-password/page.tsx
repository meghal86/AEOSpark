import Link from "next/link";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { SiteHeader } from "@/components/site-header";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader minimal />

      <section className="app-fade-up pt-16 pb-24 md:pt-24">
        <span className="ui-kicker">Password recovery</span>
        <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
          Reset your password.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">
          Enter the email on your AEOSpark account and we&rsquo;ll send a secure
          link to set a new password.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1px_1fr] lg:gap-16">
          <div>
            <span className="ui-kicker">Email address</span>
            <div className="mt-6">
              <ForgotPasswordForm />
            </div>
          </div>

          <div className="hidden bg-[var(--border)] lg:block" aria-hidden />

          <div className="grid gap-5 text-sm leading-relaxed">
            <div>
              <span className="ui-kicker">No password yet?</span>
              <p className="mt-3">
                If you bought an audit before creating an account, create an
                account with the same checkout email or use Google with that
                email.
              </p>
            </div>
            <div>
              <span className="ui-kicker">Remembered it?</span>
              <p className="mt-3">
                Head back to{" "}
                <Link
                  className="font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
                  href="/sign-in"
                >
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
