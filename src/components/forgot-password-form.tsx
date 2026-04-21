"use client";

import { useEffect, useState } from "react";

import { BUYER_SESSION_KEY, readBuyerSession } from "@/lib/buyer-session";
import { createBrowserAuthClient } from "@/lib/supabase-browser-auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = readBuyerSession(window.localStorage.getItem(BUYER_SESSION_KEY));
    if (stored?.email) {
      setEmail((current) => current || stored.email);
    }
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  function secondsFromRateLimit(messageText: string) {
    const match = messageText.match(/after\s+(\d+)\s+seconds?/i);
    return match ? Number(match[1]) : 60;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createBrowserAuthClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        throw error;
      }

      setCooldownSeconds(60);
      setMessage(
        "Reset link sent. Check your inbox and spam folder. If it does not arrive, wait for the countdown and request a new link. Use only the newest email.",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to send reset email.";

      if (/security purposes|rate limit|wait/i.test(errorMessage)) {
        const seconds = secondsFromRateLimit(errorMessage);
        setCooldownSeconds(seconds);
        setMessage(
          `Supabase is limiting reset emails for this account. Wait ${seconds} seconds, then request a new link. If the first email arrives, use the newest reset email only.`,
        );
      } else {
        setMessage(errorMessage);
      }
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
        disabled={isSubmitting || cooldownSeconds > 0}
        type="submit"
      >
        {isSubmitting
          ? "Sending reset link..."
          : cooldownSeconds > 0
            ? `Try again in ${cooldownSeconds}s`
            : "Send reset link"}
      </button>

      {message ? <p className="text-sm leading-7 text-stone-600">{message}</p> : null}
    </form>
  );
}
