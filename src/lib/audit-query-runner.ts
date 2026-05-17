import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import { appEnv } from "@/lib/env";

export type ProviderResult = {
  cited: boolean;
  competitor_cited: string | null;
  all_brands: string[];
  target_position: number;
  sentiment: string;
  excerpt: string;
};

export type QueryPairResult = {
  query: string;
  claude: ProviderResult | null;
  chatgpt: ProviderResult | null;
};

const anthropic = appEnv.anthropicApiKey
  ? new Anthropic({ apiKey: appEnv.anthropicApiKey })
  : null;
const openai = appEnv.openAiApiKey
  ? new OpenAI({ apiKey: appEnv.openAiApiKey })
  : null;

function extractAnthropicText(response: unknown) {
  if (!response || typeof response !== "object" || !("content" in response)) {
    return "";
  }

  const content = response.content;
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) =>
      block && typeof block === "object" && "text" in block
        ? String(block.text)
        : "",
    )
    .join("\n");
}

function brandTokens(domain: string) {
  const cleanDomain = domain.replace(/^www\./, "").toLowerCase();
  const root = cleanDomain.split(".")[0]?.replace(/[-_]/g, " ") || cleanDomain;
  return [cleanDomain, root].filter(Boolean);
}

function isBrandCited(text: string, domain: string) {
  const lower = text.toLowerCase();
  return brandTokens(domain).some((token) => lower.includes(token));
}

function extractCompetitors(text: string, domain: string) {
  const clientRoot = domain.split(".")[0].replace(/[-_]/g, " ").toLowerCase();
  const matches = text.match(/\b[A-Z][A-Za-z0-9&.-]*(?:\s+[A-Z][A-Za-z0-9&.-]*){0,2}\b/g) || [];
  const stopWords = new Set([
    "AI", "API", "Best", "ChatGPT", "Claude", "CRM", "Google", "However",
    "If", "In", "Instead", "It", "Microsoft", "OpenAI", "The", "This",
    "Tools", "When", "You", "Your",
  ]);
  const seen = new Set<string>();

  return matches
    .map((match) => match.trim().replace(/[.,;:!?]+$/, ""))
    .filter((match) => match.length > 3)
    .filter((match) => !stopWords.has(match))
    .filter((match) => !match.toLowerCase().includes(clientRoot))
    .filter((match) => {
      const key = match.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function classifySentiment(text: string, domain: string) {
  const lower = text.toLowerCase();
  const clientName = domain.split(".")[0].toLowerCase();
  const index = lower.indexOf(clientName);
  if (index === -1) return "not_mentioned";

  const context = lower.slice(Math.max(0, index - 100), index + 200);
  const positive = ["recommend", "great", "excellent", "best", "top", "trusted", "leading"];
  const negative = ["expensive", "limited", "lacks", "avoid", "issues", "complaints"];
  const posScore = positive.filter((word) => context.includes(word)).length;
  const negScore = negative.filter((word) => context.includes(word)).length;

  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

function buildProviderResult(text: string, domain: string): ProviderResult {
  const cited = isBrandCited(text, domain);
  const competitors = extractCompetitors(text, domain);
  const clientName = domain.split(".")[0].toLowerCase();
  const allBrands = cited ? [clientName, ...competitors] : competitors;

  return {
    cited,
    competitor_cited: competitors[0] ?? null,
    all_brands: allBrands,
    target_position: cited ? allBrands.indexOf(clientName) + 1 : 0,
    sentiment: classifySentiment(text, domain),
    excerpt: text.slice(0, 250),
  };
}

export async function runClaudeCitationQuery(query: string, domain: string) {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is required.");
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `${query}\n\nBe specific. Name actual products and companies.`,
      },
    ],
  });

  return buildProviderResult(extractAnthropicText(response), domain);
}

export async function runChatGptCitationQuery(query: string, domain: string) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `${query}\n\nBe specific. Name actual products and companies.`,
      },
    ],
  });

  return buildProviderResult(response.choices[0]?.message?.content || "", domain);
}

export async function runCitationQueryPair(
  query: string,
  domain: string,
): Promise<QueryPairResult> {
  const [claudeResult, chatgptResult] = await Promise.allSettled([
    runClaudeCitationQuery(query, domain),
    runChatGptCitationQuery(query, domain),
  ]);

  return {
    query,
    claude: claudeResult.status === "fulfilled" ? claudeResult.value : null,
    chatgpt: chatgptResult.status === "fulfilled" ? chatgptResult.value : null,
  };
}

export function summarizeCitationResults(results: QueryPairResult[]) {
  const totalQueries = Math.max(results.length, 1);
  const claudeCited = results.filter((result) => result.claude?.cited).length;
  const chatgptCited = results.filter((result) => result.chatgpt?.cited).length;
  const competitorCounts = new Map<string, number>();

  for (const result of results) {
    for (const competitor of [
      result.claude?.competitor_cited,
      result.chatgpt?.competitor_cited,
    ]) {
      if (!competitor) continue;
      competitorCounts.set(competitor, (competitorCounts.get(competitor) || 0) + 1);
    }
  }

  const topCompetitors = [...competitorCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  return {
    claudeCited,
    chatgptCited,
    claudeShare: Math.round((claudeCited / totalQueries) * 100),
    chatgptShare: Math.round((chatgptCited / totalQueries) * 100),
    topCompetitors,
  };
}
