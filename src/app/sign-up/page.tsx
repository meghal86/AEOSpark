import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleOAuthButton } from "@/components/google-oauth-button";
import { PasswordSignUpForm } from "@/components/password-sign-up-form";
import { SiteHeader } from "@/components/site-header";
import { createServerAuthClient } from "@/lib/supabase-auth";

function decodeValue(value?: string | string[]) {
  if (!value) {
    return "";
  }

  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    redirect("/account");
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-6 md:px-10 md:py-10">
      <SiteHeader minimal />

      <section className="app-fade-up pt-16 pb-24 md:pt-24">
        <div className="grid gap-3">
          <span className="ui-kicker">Create account</span>
          <h1 className="text-5xl tracking-tight md:text-6xl">
            Save your reports to one account.
          </h1>
          <p className="mt-1 max-w-2xl text-base leading-relaxed">
            Create your AEOSpark account with a password or Google.
            Your paid audits stay available under one login.
          </p>
        </div>

        <dl className="mt-10 grid gap-6 border-t border-[var(--border)] pt-8 text-sm md:grid-cols-3">
          <div className="grid gap-1">
            <dt className="font-medium text-[var(--foreground)]">One login</dt>
            <dd className="leading-relaxed text-[var(--foreground-muted)]">
              All delivered reports stay under the same buyer account.
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="font-medium text-[var(--foreground)]">Choose access</dt>
            <dd className="leading-relaxed text-[var(--foreground-muted)]">
              Use a password for standard sign-in or continue with Google.
            </dd>
          </div>
          <div className="grid gap-1">
            <dt className="font-medium text-[var(--foreground)]">Buyer ownership</dt>
            <dd className="leading-relaxed text-[var(--foreground-muted)]">
              Reports, PDFs, and audit history stay attached to your email.
            </dd>
          </div>
        </dl>

        <div className="mt-14 grid gap-16 md:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            <span className="ui-kicker">Password sign-up</span>
            <PasswordSignUpForm
              defaultEmail={decodeValue(resolved.email)}
              defaultName={decodeValue(resolved.name)}
              defaultWebsite={decodeValue(resolved.website)}
            />
          </div>

          <div className="grid gap-6 md:border-l md:border-[var(--border)] md:pl-16">
            <span className="ui-kicker">Google</span>
            <div className="grid gap-4">
              <GoogleOAuthButton label="Create account with Google" />
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Google sign-up requires the Google provider to be enabled in
                Supabase Auth.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-16 border-t border-[var(--border)] pt-8 text-sm text-[var(--foreground-muted)]">
          Already have access?{" "}
          <Link
            className="font-medium text-[var(--foreground)] underline underline-offset-2 hover:text-[var(--accent)]"
            href="/sign-in"
          >
            Sign in
          </Link>
          {" "}or{" "}
          <Link
            className="font-medium text-[var(--foreground)] underline underline-offset-2 hover:text-[var(--accent)]"
            href="/forgot-password"
          >
            reset your password
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
