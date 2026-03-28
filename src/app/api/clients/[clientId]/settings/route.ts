import { NextResponse } from "next/server";

import { encryptSecret } from "@/lib/crypto";
import { upsertClientCredential } from "@/lib/storage";
import type { ProviderName } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const body = (await request.json()) as {
    apiKey?: string;
    provider?: ProviderName;
  };

  if (!body.provider) {
    return NextResponse.json({ error: "Provider is required." }, { status: 400 });
  }

  const encryptedKey = body.apiKey ? encryptSecret(body.apiKey) : undefined;
  const client = await upsertClientCredential(clientId, body.provider, {
    connected: Boolean(body.apiKey),
    encryptedKey,
    lastUpdatedAt: new Date().toISOString(),
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
