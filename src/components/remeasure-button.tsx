"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RemeasureButton(props: {
  orderId: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(props.disabledReason || null);

  async function handleClick() {
    setMessage(null);

    try {
      const response = await fetch("/api/remeasure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: props.orderId }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Unable to start re-measurement.");
      }

      setMessage("Re-measurement started. Refresh in a few minutes to see the new run.");
      startTransition(() => router.refresh());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start re-measurement.");
    }
  }

  return (
    <div className="grid gap-3">
      <button
        className="btn-accent inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={props.disabled || isPending}
        onClick={handleClick}
        type="button"
      >
        {isPending ? "Starting..." : "Run monthly re-measurement"}
      </button>
      {message ? (
        <p className="text-xs leading-6 text-[var(--foreground-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
