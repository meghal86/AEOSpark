"use client";

import Link from "next/link";
import { useState } from "react";

import { BUYER_SESSION_KEY, readBuyerSession, type BuyerSessionState } from "@/lib/buyer-session";

export function PurchasedHomeBanner() {
  const [session] = useState<BuyerSessionState | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return readBuyerSession(window.localStorage.getItem(BUYER_SESSION_KEY));
  });

  if (!session) {
    return null;
  }

  const statusLabel =
    session.status === "delivered" ? "Report ready" : "Audit in progress";
  const targetHref =
    session.status === "delivered"
      ? session.reportUrl || `/report/${session.orderReference}`
      : `/report/${session.orderReference}`;

  return (
    <section className="mb-8 rounded-[var(--radius-md)] border border-[var(--accent)]/25 bg-[var(--accent-soft)] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-deep)]">
            {statusLabel}
          </span>
          <p className="text-sm leading-relaxed text-[var(--accent-deep)]">
            You already have an audit for{" "}
            <span className="font-semibold">{session.domain}</span>, linked to{" "}
            <span className="font-semibold">{session.email}</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="btn-secondary inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-medium transition"
            href="/account"
          >
            My reports
          </Link>
          <Link
            className="btn-accent inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition"
            href={targetHref}
          >
            {session.status === "delivered" ? "Open report" : "Track audit"}
          </Link>
        </div>
      </div>
    </section>
  );
}
