import Link from "next/link";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { SiteHeader } from "@/components/site-header";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader minimal />

      <section className="app-fade-up pt-16 pb-24 md:pt-24">
        <span className="ui-kicker">Set new password</span>
        <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
          Choose a new password.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed">
          Once you update your password, you&rsquo;ll be sent straight into your
          AEOSpark account.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1px_1fr] lg:gap-16">
          <div>
            <span className="ui-kicker">New password</span>
            <div className="mt-6">
              <ResetPasswordForm />
            </div>
          </div>

          <div className="hidden bg-[var(--border)] lg:block" aria-hidden />

          <div className="text-sm leading-relaxed">
            <span className="ui-kicker">Link expired?</span>
            <p className="mt-3">
              Reset links expire quickly for security. Request a fresh one and
              use only the newest email.
            </p>
            <Link
              className="mt-4 inline-flex font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
              href="/forgot-password"
            >
              Request another reset link →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
