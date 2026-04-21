"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createBrowserAuthClient } from "@/lib/supabase-browser-auth";

function validatePassword(value: string) {
  if (value.length < 8) {
    throw new Error("Use at least 8 characters for your password.");
  }

  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
    throw new Error("Use uppercase, lowercase, and at least one number.");
  }
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function cleanResetUrl() {
      window.history.replaceState(null, "", "/reset-password");
    }

    async function establishRecoverySession() {
      try {
        const supabase = createBrowserAuthClient();

        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const urlError = searchParams.get("error_description") || hashParams.get("error_description");
        const code = searchParams.get("code");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (urlError) {
          throw new Error(urlError.replace(/\+/g, " "));
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
          cleanResetUrl();
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
          cleanResetUrl();
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }

        if (!cancelled) {
          setStatus(data.session ? "ready" : "invalid");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "This reset link has expired or is no longer valid.",
          );
          setStatus("invalid");
        }
      }
    }

    void establishRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      validatePassword(password);

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

  if (status === "invalid") {
    return (
      <div className="grid gap-4">
        <p className="text-sm leading-7 text-stone-700">
          {message ||
            "This reset link has expired or is no longer valid. Request a new password reset email to continue."}
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
          autoComplete="new-password"
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
          autoComplete="new-password"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm your new password"
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      <p className="text-xs leading-6 text-stone-500">
        Use at least 8 characters with uppercase, lowercase, and a number.
      </p>

      <button
        className="btn-primary inline-flex h-14 items-center justify-center rounded-2xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting || status === "checking"}
        type="submit"
      >
        {isSubmitting
          ? "Updating password..."
          : status === "checking"
            ? "Verifying reset link..."
            : "Set new password"}
      </button>

      {message ? <p className="text-sm text-stone-600">{message}</p> : null}
    </form>
  );
}
