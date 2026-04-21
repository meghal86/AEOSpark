"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserAuthClient } from "@/lib/supabase-browser-auth";
import { normalizePublicUrl } from "@/lib/url-security";

export function PasswordSignUpForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

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
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const normalizedWebsite = normalizePublicUrl(website);
      const supabase = createBrowserAuthClient();
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/confirm?next=/account`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            fullName,
            companyName,
            website: normalizedWebsite,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.push("/account");
        router.refresh();
        return;
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setMessage(
          "An account already exists for this email. Sign in with your password, use the email-link option, or reset your password if you never set one.",
        );
        return;
      }

      setMessage(
        "Account created. Check your email to confirm your account, then sign in.",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to create account.";

      if (/security purposes|rate limit|too many requests|email rate limit/i.test(errorMessage)) {
        const seconds = secondsFromRateLimit(errorMessage);
        setCooldownSeconds(seconds);
        setMessage(
          `Supabase is temporarily limiting account emails for this project. Wait ${seconds} seconds, then try again once. If you already requested a confirmation email, check inbox and spam first.`,
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
        Full name
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Your full name"
          required
          type="text"
          value={fullName}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Company name
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder="Your company"
          required
          type="text"
          value={companyName}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Website
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="yourcompany.com"
          required
          type="text"
          value={website}
        />
      </label>

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

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Password
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a password"
          required
          type="password"
          value={password}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Confirm password
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm your password"
          required
          type="password"
          value={confirmPassword}
        />
      </label>

      <button
        className="btn-primary inline-flex h-14 items-center justify-center rounded-2xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting || cooldownSeconds > 0}
        type="submit"
      >
        {isSubmitting
          ? "Creating account..."
          : cooldownSeconds > 0
            ? `Try again in ${cooldownSeconds}s`
            : "Create account"}
      </button>

      {message ? <p className="text-sm leading-7 text-stone-600">{message}</p> : null}
    </form>
  );
}
