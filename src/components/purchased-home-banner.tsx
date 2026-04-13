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
    <section className="surface-card rounded-[1.8rem] border border-emerald-200/80 bg-emerald-50/80 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="grid gap-1">
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900">
            {statusLabel}
          </p>
          <p className="text-sm leading-7 text-emerald-950">
            You already have an AEOSpark audit for{" "}
            <span className="font-semibold">{session.domain}</span>. We&apos;ll keep this linked to{" "}
            <span className="font-semibold">{session.email}</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            href="/account"
          >
            My Reports
          </Link>
          <Link
            className="btn-primary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
            href={targetHref}
          >
            {session.status === "delivered" ? "Open Report" : "Track Audit"}
          </Link>
        </div>
      </div>
    </section>
  );
}
