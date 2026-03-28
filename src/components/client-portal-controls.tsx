"use client";

import { useState } from "react";

import type { ProviderCredential } from "@/lib/types";

export function ClientPortalControls(props: {
  clientId: string;
  providers: ProviderCredential[];
}) {
  const [status, setStatus] = useState("");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  async function saveKey(provider: ProviderCredential["provider"]) {
    setStatus("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/clients/${props.clientId}/settings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: keys[provider] || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save API key.");
      }

      setStatus(`${provider} key saved.`);
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runRefresh() {
    setStatus("");
    setIsRunning(true);

    try {
      const response = await fetch(`/api/clients/${props.clientId}/run`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Unable to run citation refresh.");
      }

      setStatus("Citation refresh completed.");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Refresh failed.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="surface-panel grid gap-5 rounded-[2rem] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ui-kicker text-xs font-semibold uppercase tracking-[0.24em]">
            Controls
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-950">
            Run monitor + save keys
          </h2>
        </div>
        <button
          className="btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold transition disabled:opacity-60"
          disabled={isRunning}
          onClick={runRefresh}
          type="button"
        >
          {isRunning ? "Running..." : "Run citation refresh"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {props.providers.map((provider) => (
          <div
            className="surface-card rounded-3xl p-4"
            key={provider.provider}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-950">{provider.provider}</p>
              <span
                className={`text-xs ${
                  provider.connected ? "status-success" : "status-warning"
                }`}
              >
                {provider.connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <input
              className="input-field mt-4 h-11 w-full rounded-2xl px-4 text-sm"
              onChange={(event) =>
                setKeys((current) => ({
                  ...current,
                  [provider.provider]: event.target.value,
                }))
              }
              placeholder={`Paste ${provider.provider} API key`}
              value={keys[provider.provider] || ""}
            />
            <button
              className="btn-secondary mt-3 inline-flex h-10 w-full items-center justify-center rounded-2xl text-sm font-semibold transition disabled:opacity-60"
              disabled={isSaving}
              onClick={() => saveKey(provider.provider)}
              type="button"
            >
              Save key
            </button>
          </div>
        ))}
      </div>

      {status ? <p className="text-sm text-stone-700">{status}</p> : null}
    </section>
  );
}
