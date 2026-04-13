import Link from "next/link";

import { PageUtilityNav } from "@/components/page-utility-nav";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10">
      <PageUtilityNav />

      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
          Set new password
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
          Choose a new password
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
          Once you update your password, you&apos;ll be sent straight into your AEOSpark account.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Reset password
            </p>
            <div className="mt-4">
              <ResetPasswordForm />
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Need another email?
            </p>
            <div className="mt-4 grid gap-4 text-sm leading-7 text-stone-700">
              <p>If your reset link expired, request a fresh one and use the newest email only.</p>
              <Link className="font-semibold text-stone-950 underline" href="/forgot-password">
                Request another reset link
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
