"use client";

import { useEffect, useState } from "react";

import { BUYER_SESSION_KEY, readBuyerSession } from "@/lib/buyer-session";
import { normalizePublicUrl } from "@/lib/url-security";

export function AccountAccessForm(props?: {
  mode?: "sign-in" | "sign-up";
  defaultEmail?: string;
  defaultName?: string;
  defaultCompany?: string;
  defaultWebsite?: string;
  submitLabel?: string;
  successMessage?: string;
}) {
  const isSignUp = props?.mode === "sign-up";
  const [fullName, setFullName] = useState(props?.defaultName || "");
  const [email, setEmail] = useState(props?.defaultEmail || "");
  const [companyName, setCompanyName] = useState(props?.defaultCompany || "");
  const [website, setWebsite] = useState(props?.defaultWebsite || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (props?.defaultEmail || typeof window === "undefined") {
      return;
    }

    const stored = readBuyerSession(window.localStorage.getItem(BUYER_SESSION_KEY));
    if (stored?.email) {
      setEmail((current) => current || stored.email);
    }
  }, [props?.defaultEmail]);

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
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName: isSignUp ? fullName : undefined,
          companyName: isSignUp ? companyName : undefined,
          website: isSignUp ? normalizePublicUrl(website) : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Unable to send the access link.");
      }

      setMessage(props?.successMessage || "Check your email for the access link.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to send the access link.";

      if (/security purposes|rate limit|too many requests|email rate limit/i.test(errorMessage)) {
        const seconds = secondsFromRateLimit(errorMessage);
        setCooldownSeconds(seconds);
        setMessage(
          `Supabase is temporarily limiting email links for this project. Wait ${seconds} seconds, then request one new link. If an email arrives, use the newest link only.`,
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
      {isSignUp ? (
        <>
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            Full name
            <input
              className="input-field h-14 rounded-2xl px-4 text-base"
              name="fullName"
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
              name="companyName"
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Your company"
              required
              type="text"
              value={companyName}
            />
          </label>
        </>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-stone-700">
        Work email
        <input
          className="input-field h-14 rounded-2xl px-4 text-base"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          type="email"
          value={email}
        />
      </label>

      {isSignUp ? (
        <label className="grid gap-2 text-sm font-medium text-stone-700">
          Website
          <input
            className="input-field h-14 rounded-2xl px-4 text-base"
            name="website"
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="yourcompany.com"
            required
            type="text"
            value={website}
          />
        </label>
      ) : null}

      <button
        className="btn-primary inline-flex h-14 items-center justify-center rounded-2xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting || cooldownSeconds > 0}
        type="submit"
      >
        {isSubmitting
          ? "Sending access link..."
          : cooldownSeconds > 0
            ? `Try again in ${cooldownSeconds}s`
            : props?.submitLabel || "Send access link →"}
      </button>

      {message ? <p className="text-sm leading-7 text-stone-600">{message}</p> : null}
    </form>
  );
}
