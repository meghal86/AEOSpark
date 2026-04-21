"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/loading-spinner";
import { BUYER_SESSION_KEY, readBuyerSession } from "@/lib/buyer-session";
import { createBrowserAuthClient } from "@/lib/supabase-browser-auth";

export function PasswordSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          throw new Error(
            "Invalid email or password. If you originally used an email link, reset your password first or use the email-link sign-in option below.",
          );
        }
        throw error;
      }

      router.push("/account");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
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
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Password
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          required
          type="password"
          value={password}
        />
      </label>

      <p className="text-xs leading-6 text-stone-500">
        Password sign-in is handled by Supabase over HTTPS. AEOSpark does not store your password.
      </p>

      <button
        className="btn-primary inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting && <LoadingSpinner size="sm" className="text-white/70" />}
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      {message ? <p className="text-sm leading-7 text-stone-600">{message}</p> : null}
    </form>
  );
}
