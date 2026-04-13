"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createBrowserAuthClient } from "@/lib/supabase-browser-auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const supabase = createBrowserAuthClient();
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          setHasSession(Boolean(data.session));
        }
      } catch {
        if (!cancelled) {
          setHasSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (password.length < 8) {
        throw new Error("Use at least 8 characters for your password.");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const supabase = createBrowserAuthClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      router.push("/account");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasSession === false) {
    return (
      <div className="grid gap-4">
        <p className="text-sm leading-7 text-stone-700">
          This reset link has expired or is no longer valid. Request a new password reset email to
          continue.
        </p>
        <Link className="font-semibold text-stone-950 underline" href="/forgot-password">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-stone-700">
        New password
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a new password"
          required
          type="password"
          value={password}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Confirm new password
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm your new password"
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      <button
        className="btn-primary inline-flex h-14 items-center justify-center rounded-2xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting || hasSession === null}
        type="submit"
      >
        {isSubmitting ? "Updating password..." : "Set new password"}
      </button>

      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}
