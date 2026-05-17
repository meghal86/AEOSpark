"use client";

import { useState } from "react";

import { createBrowserAuthClient } from "@/lib/supabase-browser-auth";

export function GoogleOAuthButton(props: { label?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createBrowserAuthClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/confirm?next=/account`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start Google sign-in.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <button
        className="inline-flex h-12 items-center justify-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        onClick={handleClick}
        type="button"
      >
        <span
          aria-hidden
          className="grid h-5 w-5 place-items-center rounded-full border border-[var(--border)] text-xs font-bold"
        >
          G
        </span>
        {isSubmitting ? "Opening Google..." : props.label || "Continue with Google"}
      </button>

      {message ? (
        <p className="text-sm leading-7 text-[var(--foreground-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
