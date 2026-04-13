"use client";

import Link from "next/link";
import { useState } from "react";

import { formatDate } from "@/lib/format";

type ReportSummary = {
  orderId: string;
  reference: string;
  domain: string;
  deliveredAt: string;
  reportUrl: string | null;
  report: {
    claudeCited: number;
    chatgptCited: number;
  } | null;
};

type AccountProfile = {
  email: string;
  fullName?: string | null;
  companyName?: string | null;
  website?: string | null;
};

export function AccountTabs(props: {
  reports: ReportSummary[];
  profile: AccountProfile;
}) {
  const [tab, setTab] = useState<"documents" | "profile">("documents");

  return (
    <section className="surface-panel rounded-[2.5rem] p-8">
      <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.22em]">
        Buyer account
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-950">
        Your account
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-700">
        Signed in as <span className="font-semibold text-stone-950">{props.profile.email}</span>.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition ${
            tab === "documents" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => setTab("documents")}
          type="button"
        >
          Documents
        </button>
        <button
          className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition ${
            tab === "profile" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => setTab("profile")}
          type="button"
        >
          Profile
        </button>
      </div>

      {tab === "documents" ? (
        props.reports.length ? (
          <div className="mt-8 grid gap-4">
            {props.reports.map((item) => (
              <article
                className="surface-card grid gap-4 rounded-[2rem] p-6 md:grid-cols-[1fr_auto]"
                key={item.orderId}
              >
                <div className="grid gap-3">
                  <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
                    {item.domain}
                  </p>
                  <h2 className="text-2xl font-semibold text-stone-950">
                    AI visibility audit report
                  </h2>
                  <p className="text-sm leading-7 text-stone-700">
                    Delivered on {formatDate(item.deliveredAt)}.
                    {item.report
                      ? ` Claude cited you in ${item.report.claudeCited}/20 queries and ChatGPT cited you in ${item.report.chatgptCited}/20.`
                      : " Your report is ready to review."}
                  </p>
                </div>

                <div className="grid gap-3 md:min-w-56">
                  <Link
                    className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
                    href={`/report/${item.reference}`}
                  >
                    View Report →
                  </Link>
                  <Link
                    className="btn-secondary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
                    href={`/api/reports/${item.reference}/download`}
                    target="_blank"
                  >
                    Download PDF →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.8rem] border border-stone-200 bg-stone-50/80 px-5 py-5 text-sm leading-7 text-stone-700">
            No documents yet. Your completed audits will appear under this tab automatically.
          </div>
        )
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Account owner
            </p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-stone-700">
              <p>
                <span className="font-semibold text-stone-950">Name:</span>{" "}
                {props.profile.fullName || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Email:</span>{" "}
                {props.profile.email}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Company:</span>{" "}
                {props.profile.companyName || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-stone-950">Website:</span>{" "}
                {props.profile.website || "Not set"}
              </p>
            </div>
          </div>

          <div className="surface-card rounded-[2rem] p-6">
            <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.18em]">
              Documents sync
            </p>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              AEOSpark pulls your documents from Supabase based on the signed-in account email.
              Any delivered audit tied to this email appears under the Documents tab automatically.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
