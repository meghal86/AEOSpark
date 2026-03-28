import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { decryptSecret } from "@/lib/crypto";
import { getClientById } from "@/lib/storage";
import type { CitationQueryResult, CitationRunRecord } from "@/lib/types";

export async function runCitationCheck(
  clientId: string,
  query: string,
  platform: "claude" | "chatgpt",
): Promise<CitationQueryResult> {
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error("Client not found.");
  }

  const anthropicCredential = client.apiKeyStatus.find(
    (item) => item.provider === "Anthropic",
  )?.encryptedKey;
  const openAiCredential = client.apiKeyStatus.find(
    (item) => item.provider === "OpenAI",
  )?.encryptedKey;

  if (platform === "claude") {
    if (!anthropicCredential) {
      throw new Error(
        "API key required. Client must add their Anthropic API key in settings before citation monitoring can run.",
      );
    }

    const anthropic = new Anthropic({
      apiKey: decryptSecret(anthropicCredential),
    });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: query }],
    });
    const text = response.content
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n");
    const cited = text.toLowerCase().includes(client.website.toLowerCase()) ||
      text.toLowerCase().includes(new URL(client.website).hostname.replace(/^www\./, "").toLowerCase());

    return {
      id: crypto.randomUUID(),
      provider: "Anthropic",
      query,
      cited,
      sentiment: "neutral",
      snippet: text.slice(0, 300),
    };
  }

  if (!openAiCredential) {
    throw new Error(
      "API key required. Client must add their Anthropic API key in settings before citation monitoring can run.",
    );
  }

  const openai = new OpenAI({
    apiKey: decryptSecret(openAiCredential),
  });
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [{ role: "user", content: query }],
  });
  const text = response.choices[0]?.message?.content || "";
  const cited = text.toLowerCase().includes(client.website.toLowerCase()) ||
    text.toLowerCase().includes(new URL(client.website).hostname.replace(/^www\./, "").toLowerCase());

  return {
    id: crypto.randomUUID(),
    provider: "OpenAI",
    query,
    cited,
    sentiment: "neutral",
    snippet: text.slice(0, 300),
  };
}

export async function runCitationMonitor(client: { id: string; companyName: string }) {
  const queries = [
    `What is ${client.companyName}?`,
    `${client.companyName} pricing`,
    `${client.companyName} reviews`,
    `${client.companyName} alternatives`,
  ];

  const results = (
    await Promise.all(
      queries.flatMap((query) => [
        runCitationCheck(client.id, query, "claude"),
        runCitationCheck(client.id, query, "chatgpt"),
      ]),
    )
  ).flat();

  const citedCount = results.filter((result) => result.cited).length;
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    clientId: client.id,
    queryCount: results.length,
    clientCitationShare: Math.round((citedCount / Math.max(results.length, 1)) * 100),
    competitorCitationShare: 0,
    alertTriggered: false,
    queryResults: results,
  } satisfies CitationRunRecord;
}
