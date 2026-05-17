import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleOAuthButton } from "@/components/google-oauth-button";
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
    <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader minimal />

      <section className="app-fade-up pt-16 pb-24 md:pt-24">
        {showSignedOutBanner && (
          <div className="mb-10 flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-5 py-3.5 text-sm font-medium text-[var(--accent-deep)]">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            You have been signed out successfully.
          </div>
        )}

        <div className="grid gap-3">
          <span className="ui-kicker">Sign in</span>
          <h1 className="text-5xl tracking-tight md:text-6xl">
            Welcome back.
          </h1>
          <p className="mt-1 max-w-xl text-base leading-relaxed">
            Sign in with your password to access your reports, downloads, and
            account history. You can also continue with Google.
          </p>
        </div>

        <div className="mt-14 grid gap-16 md:grid-cols-2">
          <div className="grid gap-6">
            <span className="ui-kicker">Password</span>
            <PasswordSignInForm />
            <p className="text-sm text-[var(--foreground-muted)]">
              Forgot your password?{" "}
              <Link
                className="font-medium text-[var(--foreground)] underline underline-offset-2 hover:text-[var(--accent)]"
                href="/forgot-password"
              >
                Reset it here
              </Link>
            </p>
          </div>

          <div className="grid gap-6 md:border-l md:border-[var(--border)] md:pl-16">
            <span className="ui-kicker">Google</span>
            <div className="grid gap-4">
              <GoogleOAuthButton label="Sign in with Google" />
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Google sign-in requires the Google provider to be enabled in
                Supabase Auth.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-16 border-t border-[var(--border)] pt-8 text-sm text-[var(--foreground-muted)]">
          First time here?{" "}
          <Link
            className="font-medium text-[var(--foreground)] underline underline-offset-2 hover:text-[var(--accent)]"
            href="/sign-up"
          >
            Create your account →
          </Link>
        </p>
      </section>
    </main>
  );
}
