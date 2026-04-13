"use client";

import { useEffect, useState } from "react";

import { BUYER_SESSION_KEY, readBuyerSession } from "@/lib/buyer-session";
import { createBrowserAuthClient } from "@/lib/supabase-browser-auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = readBuyerSession(window.localStorage.getItem(BUYER_SESSION_KEY));
    if (stored?.email) {
      setEmail((current) => current || stored.email);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createBrowserAuthClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/confirm?next=/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        throw error;
      }

      setMessage("Check your email for the password reset link.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Work email
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          type="email"
          value={email}
        />
      </label>

      <button
        className="btn-primary inline-flex h-14 items-center justify-center rounded-2xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending reset link..." : "Send reset link"}
      </button>

      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}
