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
  signOutAction?: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"documents" | "profile">("documents");

  return (
    <section className="app-fade-up pt-16 pb-24 md:pt-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="ui-kicker">Account</span>
          <h1 className="mt-4 text-5xl tracking-tight md:text-6xl">
            Your reports.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed">
            Signed in as{" "}
            <span className="font-medium text-[var(--foreground)]">
              {props.profile.email}
            </span>
            .
          </p>
        </div>

        {props.signOutAction ? (
          <form action={props.signOutAction}>
            <button
              className="btn-ghost inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-medium transition"
              type="submit"
            >
              Sign out →
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-12 flex items-center gap-8 border-b border-[var(--border)]">
        <TabButton
          active={tab === "documents"}
          label="Documents"
          count={props.reports.length}
          onClick={() => setTab("documents")}
        />
        <TabButton
          active={tab === "profile"}
          label="Profile"
          onClick={() => setTab("profile")}
        />
      </div>

      {tab === "documents" ? (
        props.reports.length ? (
          <div className="mt-2 grid gap-0">
            {props.reports.map((item, index) => (
              <article
                key={item.orderId}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-8 border-b border-[var(--border)] py-8"
              >
                <span className="font-display text-3xl tracking-tight text-[var(--foreground-subtle)]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                    {item.domain}
                  </span>
                  <p className="text-xl font-medium text-[var(--foreground)]">
                    AI visibility audit
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Delivered on {formatDate(item.deliveredAt)}
                    {item.report ? (
                      <>
                        {" · "}Claude {item.report.claudeCited}/20, ChatGPT{" "}
                        {item.report.chatgptCited}/20
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Link
                    className="btn-accent inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-5 text-sm font-semibold transition"
                    href={`/report/${item.reference}`}
                  >
                    Open report →
                  </Link>
                  <Link
                    className="text-xs font-medium text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
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
          <div className="mt-16 grid place-items-center py-16 text-center">
            <span className="ui-kicker">No documents yet</span>
            <p className="mt-4 max-w-md text-sm leading-relaxed">
              Completed audits appear here automatically. Start with a score and
              upgrade to the full audit when you&rsquo;re ready.
            </p>
            <Link
              className="btn-accent mt-6 inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition"
              href="/"
            >
              Run a score →
            </Link>
          </div>
        )
      ) : (
        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1px_1fr]">
          <div>
            <span className="ui-kicker">Account owner</span>
            <dl className="mt-6 grid gap-4 text-sm">
              <ProfileRow label="Name" value={props.profile.fullName || "—"} />
              <ProfileRow label="Email" value={props.profile.email} />
              <ProfileRow label="Company" value={props.profile.companyName || "—"} />
              <ProfileRow label="Website" value={props.profile.website || "—"} />
            </dl>
          </div>

          <div className="hidden bg-[var(--border)] lg:block" aria-hidden />

          <div>
            <span className="ui-kicker">Documents sync</span>
            <p className="mt-6 text-sm leading-relaxed">
              AEOSpark pulls your documents from Supabase based on the signed-in
              account email. Any delivered audit tied to this email appears
              under Documents automatically.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function TabButton(props: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={props.onClick}
      type="button"
      className={`group -mb-px flex items-baseline gap-2 border-b-2 pb-4 text-sm font-medium transition ${
        props.active
          ? "border-[var(--accent)] text-[var(--foreground)]"
          : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {props.label}
      {props.count != null ? (
        <span
          className={`text-xs font-semibold ${
            props.active
              ? "text-[var(--accent)]"
              : "text-[var(--foreground-subtle)]"
          }`}
        >
          {props.count}
        </span>
      ) : null}
    </button>
  );
}

function ProfileRow(props: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-baseline gap-4 border-b border-[var(--border)] pb-3 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
        {props.label}
      </dt>
      <dd className="text-sm text-[var(--foreground)]">{props.value}</dd>
    </div>
  );
}
