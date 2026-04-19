import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";

import { inngest } from "@/inngest/client";
import { sendAuditDeliveredEmail } from "@/lib/email-workflows";
import { appEnv, assertPaidDeliveryConfig, isProductionEnv } from "@/lib/env";
import { renderAuditDeliveryPdf, type AuditReportData } from "@/lib/pdf-documents";
import { prisma } from "@/lib/prisma";
import { buildSchemaTemplates } from "@/lib/schema-templates";
import { createServerClient } from "@/lib/supabase";
import { getOrderById, updateOrderDelivery } from "@/lib/storage";
import type { AuditFix, AuditRecord, CitationQueryResult } from "@/lib/types";

type ProviderResult = {
  cited: boolean;
  competitor_cited: string | null;
  /** All brands mentioned in the response, ordered by first appearance. */
  all_brands: string[];
  /** Position of the target brand (1-indexed) in all_brands, or 0 if not cited. */
  target_position: number;
  sentiment: string;
  excerpt: string;
};

type QueryPairResult = {
  query: string;
  claude: ProviderResult | null;
  chatgpt: ProviderResult | null;
};

type ReportSections = {
  executiveSummary: string;
  gapAnalysis: string;
  topFixes: string;
  projection: string;
};

const COMPETITOR_STOP_WORDS = new Set([
  // Determiners / pronouns / conjunctions
  "A", "An", "And", "As", "At", "Be", "But", "By", "Do", "For", "From",
  "Has", "Have", "He", "Her", "Here", "His", "How", "However", "I", "If",
  "In", "Into", "Is", "It", "Its", "Let", "Many", "May", "Me", "More",
  "Most", "Much", "My", "No", "Nor", "Not", "Of", "On", "One", "Or",
  "Our", "Out", "Own", "She", "So", "Some", "Such", "Than", "That",
  "The", "Their", "Them", "Then", "There", "These", "They", "This",
  "Those", "To", "Too", "Up", "Us", "Very", "Was", "We", "Were", "What",
  "When", "Which", "While", "Who", "Why", "Will", "With", "Would", "You",
  "Your",
  // Common English words that get capitalized at sentence start
  "About", "After", "Again", "Also", "Always", "Another", "Any", "Are",
  "Available", "Based", "Because", "Been", "Before", "Being", "Below",
  "Best", "Better", "Between", "Both", "Can", "Choose", "Common",
  "Compare", "Consider", "Could", "Different", "Each", "Either", "Even",
  "Every", "Example", "Feature", "Features", "Find", "First", "Five",
  "Four", "Free", "Get", "Given", "Good", "Great", "Help", "Helps",
  "High", "Important", "Include", "Includes", "Including", "Instead",
  "Just", "Key", "Known", "Large", "Last", "Less", "Like", "Look",
  "Looking", "Made", "Main", "Make", "Makes", "Making", "Need", "New",
  "Next", "Note", "Now", "Number", "Offer", "Offers", "Often", "Only",
  "Option", "Options", "Other", "Others", "Over", "Overall", "Part",
  "Particular", "Particularly", "People", "Plan", "Plans", "Platform",
  "Platforms", "Point", "Popular", "Price", "Pricing", "Provide",
  "Provides", "Rather", "Right", "Same", "Several", "Should", "Simple",
  "Since", "Small", "Software", "Solution", "Solutions", "Specifically",
  "Start", "Still", "Strong", "Take", "Team", "Teams", "Three", "Through",
  "Time", "Today", "Together", "Tool", "Tools", "Top", "Two", "Typically",
  "Under", "Used", "Using", "Want", "Way", "Well", "Work", "Works",
  // Business jargon capitalized words
  "Advanced", "Analytics", "Application", "Automation", "Business",
  "Cloud", "Customer", "Data", "Digital", "Enterprise", "Integration",
  "Management", "Marketing", "Premium", "Professional", "Sales",
  "Security", "Service", "Services", "Standard", "Support", "System",
  "Technology", "Workflow",
]);

const anthropic = appEnv.anthropicApiKey
  ? new Anthropic({ apiKey: appEnv.anthropicApiKey })
  : null;
const openai = appEnv.openAiApiKey
  ? new OpenAI({ apiKey: appEnv.openAiApiKey })
  : null;

function companyNameFromDomain(domain: string) {
  return domain
    .split(".")[0]
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeRegExpChars(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build word-boundary regex variants for a domain so we can match
 * "HubSpot", "hubspot", "hubspot.com", "Hub Spot", etc.
 */
function buildBrandPatterns(domain: string): RegExp[] {
  const bare = domain.replace(/^www\./, "").toLowerCase();
  const withoutTld = bare.split(".")[0];
  // Split on hyphens/underscores to handle domains like "hub-spot"
  const parts = withoutTld.split(/[-_]/).filter(Boolean);
  const joined = parts.join("");              // "hubspot"
  const spaced = parts.join(" ");             // "hub spot"
  const camel = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");                                 // "HubSpot"

  const variants = [...new Set([bare, withoutTld, joined, spaced, camel])];
  return variants.map(
    (v) => new RegExp(`\\b${escapeRegExpChars(v)}\\b`, "i"),
  );
}

function isBrandCited(text: string, domain: string): boolean {
  const patterns = buildBrandPatterns(domain);
  return patterns.some((pattern) => pattern.test(text));
}

function extractAnthropicText(response: unknown) {
  if (!response || typeof response !== "object" || !("content" in response)) {
    return "";
  }

  const content = response.content;
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => ("text" in block ? block.text : ""))
    .join("\n");
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function safeJsonArray(input: string) {
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function getFallbackQueries() {
  // All queries are brand-neutral. The target company should only appear
  // in AI responses if the model genuinely considers it relevant.
  // Including the company name in queries inflates citation share and
  // makes the measurement meaningless.
  return [
    // Category / comparison queries (8)
    "What are the best tools in this category for mid-size companies?",
    "Compare the top platforms for this type of business problem",
    "What software do most teams use for this type of work?",
    "Which vendors are leading in this space right now?",
    "Best alternatives when evaluating tools in this category",
    "Top rated platforms for this use case according to analysts",
    "Which tools have the strongest integrations in this space?",
    "What platform do fast-growing companies pick for this?",
    // Problem-based queries (6)
    "How do I reduce manual work in this area of the business?",
    "How do I improve efficiency in this workflow without adding headcount?",
    "What is the best way to solve this problem for a 50-person team?",
    "How do enterprises handle this challenge at scale?",
    "What do consultants recommend for this type of project?",
    "How do I evaluate vendors for this kind of platform?",
    // Persona-based queries (4)
    "What do marketing directors typically use for this?",
    "What do CTOs recommend for solving this problem?",
    "What do agencies use to manage this for their clients?",
    "What platform do startups choose when they first need this?",
    // Purchase-trigger queries (2)
    "I need to pick a vendor this quarter — what should I shortlist?",
    "What are the must-have features when buying in this category?",
  ];
}

function mergeJson(
  current: unknown,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  if (!current || typeof current !== "object" || Array.isArray(current)) {
    return patch as Prisma.InputJsonValue;
  }

  return {
    ...(current as Record<string, unknown>),
    ...patch,
  } as Prisma.InputJsonValue;
}

async function upsertAuditResult(
  orderId: string,
  domain: string,
  patch: {
    claudeQueries?: unknown;
    chatgptQueries?: unknown;
    citationSharePct?: number;
    competitor1Domain?: string | null;
    competitor1SharePct?: number | null;
    competitor2Domain?: string | null;
    competitor2SharePct?: number | null;
    bingIndexed?: boolean;
    bingPageCount?: number;
    braveIndexed?: boolean;
    fullReportJson?: Record<string, unknown>;
  },
) {
  const existing = await prisma.auditResult.findFirst({
    where: { orderId },
  });

  if (existing) {
    return prisma.auditResult.update({
      where: { id: existing.id },
      data: {
        domain,
        claudeQueries: patch.claudeQueries ?? undefined,
        chatgptQueries: patch.chatgptQueries ?? undefined,
        citationSharePct: patch.citationSharePct ?? undefined,
        competitor1Domain:
          patch.competitor1Domain !== undefined ? patch.competitor1Domain : undefined,
        competitor1SharePct:
          patch.competitor1SharePct !== undefined ? patch.competitor1SharePct : undefined,
        competitor2Domain:
          patch.competitor2Domain !== undefined ? patch.competitor2Domain : undefined,
        competitor2SharePct:
          patch.competitor2SharePct !== undefined ? patch.competitor2SharePct : undefined,
        bingIndexed: patch.bingIndexed ?? undefined,
        bingPageCount: patch.bingPageCount ?? undefined,
        braveIndexed: patch.braveIndexed ?? undefined,
        fullReportJson: patch.fullReportJson
          ? mergeJson(existing.fullReportJson, patch.fullReportJson)
          : undefined,
      },
    });
  }

  return prisma.auditResult.create({
    data: {
      orderId,
      domain,
      claudeQueries: patch.claudeQueries as Prisma.InputJsonValue | undefined,
      chatgptQueries: patch.chatgptQueries as Prisma.InputJsonValue | undefined,
      citationSharePct: patch.citationSharePct,
      competitor1Domain: patch.competitor1Domain ?? null,
      competitor1SharePct: patch.competitor1SharePct ?? null,
      competitor2Domain: patch.competitor2Domain ?? null,
      competitor2SharePct: patch.competitor2SharePct ?? null,
      bingIndexed: patch.bingIndexed ?? null,
      bingPageCount: patch.bingPageCount ?? null,
      braveIndexed: patch.braveIndexed ?? null,
      fullReportJson: (patch.fullReportJson ?? {}) as Prisma.InputJsonValue,
    },
  });
}

function extractAllCompetitors(text: string, domain: string): string[] {
  const clientName = domain.split(".")[0].toLowerCase();
  const clientPatterns = buildBrandPatterns(domain);
  const candidates = new Map<string, number>(); // normalized → mention count

  // Pattern 1: Brands with TLD (e.g., "monday.com", "notion.so")
  for (const match of text.matchAll(/\b([a-zA-Z][\w-]*\.(?:com|io|ai|co|so|app|dev|org))\b/g)) {
    const raw = match[1];
    const key = raw.toLowerCase().split(".")[0];
    if (key !== clientName && key.length > 2) {
      candidates.set(key, (candidates.get(key) || 0) + 1);
    }
  }

  // Pattern 2: Capitalized words that look like brand names
  // Require either multi-word or followed by context clues
  for (const match of text.matchAll(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g)) {
    const raw = match[1];
    const key = raw.toLowerCase();
    if (
      key === clientName ||
      raw.length <= 3 ||
      COMPETITOR_STOP_WORDS.has(raw) ||
      COMPETITOR_STOP_WORDS.has(raw.split(" ")[0]) ||
      raw.endsWith("ing") ||
      raw.endsWith("tion") ||
      raw.endsWith("ment") ||
      raw.endsWith("ness") ||
      raw.endsWith("able") ||
      raw.endsWith("ity") ||
      clientPatterns.some((p) => p.test(raw))
    ) {
      continue;
    }
    candidates.set(key, (candidates.get(key) || 0) + 1);
  }

  // Sort by mention count (most mentioned first) and return
  return [...candidates.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
}

function classifySentiment(text: string, domain: string) {
  const lower = text.toLowerCase();
  const clientName = domain.split(".")[0].toLowerCase();
  const index = lower.indexOf(clientName);
  if (index === -1) return "not_mentioned";
  const context = lower.slice(Math.max(0, index - 100), index + 200);
  const positive = [
    "recommend",
    "great",
    "excellent",
    "best",
    "top",
    "popular",
    "trusted",
    "leading",
  ];
  const negative = [
    "expensive",
    "limited",
    "lacks",
    "not great",
    "avoid",
    "issues",
    "complaints",
  ];
  const posScore = positive.filter((word) => context.includes(word)).length;
  const negScore = negative.filter((word) => context.includes(word)).length;
  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

async function runClaudeQuery(query: string, domain: string): Promise<ProviderResult> {
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

  const text = extractAnthropicText(response);

  return buildProviderResult(text, domain);
}

async function runChatGPTQuery(query: string, domain: string): Promise<ProviderResult> {
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

  const text = response.choices[0]?.message?.content || "";

  return buildProviderResult(text, domain);
}

function buildProviderResult(text: string, domain: string): ProviderResult {
  const cited = isBrandCited(text, domain);
  const competitors = extractAllCompetitors(text, domain);
  const clientName = domain.split(".")[0].toLowerCase();

  // Build ordered list of all brands mentioned (target + competitors)
  // by scanning the text for first-appearance order.
  const allMentions: Array<{ name: string; index: number }> = [];

  if (cited) {
    // Find target's first appearance position
    const targetPatterns = buildBrandPatterns(domain);
    let targetIndex = text.length;
    for (const pattern of targetPatterns) {
      const match = pattern.exec(text);
      if (match && match.index < targetIndex) {
        targetIndex = match.index;
      }
    }
    allMentions.push({ name: clientName, index: targetIndex });
  }

  for (const comp of competitors) {
    const pattern = new RegExp(`\\b${escapeRegExpChars(comp)}\\b`, "i");
    const match = pattern.exec(text);
    if (match) {
      allMentions.push({ name: comp.toLowerCase(), index: match.index });
    }
  }

  allMentions.sort((a, b) => a.index - b.index);
  const allBrands = allMentions.map((m) => m.name);
  const targetPosition = cited
    ? allBrands.indexOf(clientName) + 1
    : 0;

  return {
    cited,
    competitor_cited: competitors[0] ?? null,
    all_brands: allBrands,
    target_position: targetPosition,
    sentiment: classifySentiment(text, domain),
    excerpt: text.slice(0, 250),
  };
}

async function fetchHtml(url: string, timeout = 8000) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(timeout),
  });
  return response.text();
}

function parseResultCount(html: string) {
  const match = html.match(/([\d,]+)\s+results/i);
  return match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
}

function extractSection(
  source: string,
  startLabel: string,
  endLabel?: string,
) {
  const startIndex = source.indexOf(startLabel);
  if (startIndex === -1) {
    return "";
  }

  const bodyStart = startIndex + startLabel.length;
  const bodyEnd = endLabel ? source.indexOf(endLabel, bodyStart) : source.length;
  const chunk = source.slice(bodyStart, bodyEnd === -1 ? source.length : bodyEnd).trim();
  return chunk.replace(/\n{2,}/g, "\n").trim();
}

function fallbackReportSections(input: {
  domain: string;
  claudeShare: number;
  claudeCited: number;
  chatgptShare: number;
  chatgptCited: number;
  comp1: string | null;
  comp1Count: number;
  bingPageCount: number;
  braveIndexed: boolean;
}) {
  return {
    executiveSummary: `${input.domain} is currently cited in ${input.claudeCited}/20 Claude queries and ${input.chatgptCited}/20 ChatGPT queries. That is weak category visibility and means competitors are being recommended in more buying moments than the client.`,
    gapAnalysis: `${input.comp1 || "A competitor"} is appearing more often because the client still has weak structured proof, limited citation-ready pages, and shallow search/index presence. Bing page coverage is ${input.bingPageCount}, and Brave indexing is ${input.braveIndexed ? "present" : "missing"}.`,
    topFixes: `1. Publish direct-answer comparison and alternatives pages.\n2. Add stronger pricing clarity and evidence blocks on core commercial pages.\n3. Expand authority signals and third-party proof across the site.\n4. Improve citation-ready structure on high-intent pages.\n5. Re-measure after publishing the first wave of changes.`,
    projection: `If the top three fixes are implemented cleanly, a meaningful improvement in citation share over the next 60 days is realistic, especially on category and comparison queries.`,
  } satisfies ReportSections;
}

function parseTopFixes(topFixes: string): AuditFix[] {
  const items = topFixes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+[\).\s-]*/, ""));

  return items.slice(0, 5).map((item, index) => ({
    id: `${index + 1}`,
    title: item,
    whyItMatters:
      "This fix is ranked for expected citation impact based on the query results and competitor gaps in the report.",
    effort: index < 2 ? "Medium" : "High",
    expectedImpact: "High",
    steps: [item],
  }));
}

function buildLegacyAuditRecord(input: {
  orderId: string;
  domain: string;
  orderDate: string;
  companyName: string;
  queryResults: QueryPairResult[];
  reportSections: ReportSections;
  claudeShare: number;
  chatgptShare: number;
  competitor1Share: number;
}) {
  const flattenedQueryResults: CitationQueryResult[] = input.queryResults.flatMap((row) => {
    const entries: CitationQueryResult[] = [];

    if (row.claude) {
      entries.push({
        id: crypto.randomUUID(),
        provider: "Anthropic",
        query: row.query,
        cited: row.claude.cited,
        citedBrand: row.claude.competitor_cited ?? undefined,
        sentiment:
          row.claude.sentiment === "positive" || row.claude.sentiment === "negative"
            ? row.claude.sentiment
            : "neutral",
        snippet: row.claude.excerpt,
      });
    }

    if (row.chatgpt) {
      entries.push({
        id: crypto.randomUUID(),
        provider: "OpenAI",
        query: row.query,
        cited: row.chatgpt.cited,
        citedBrand: row.chatgpt.competitor_cited ?? undefined,
        sentiment:
          row.chatgpt.sentiment === "positive" || row.chatgpt.sentiment === "negative"
            ? row.chatgpt.sentiment
            : "neutral",
        snippet: row.chatgpt.excerpt,
      });
    }

    return entries;
  });

  return {
    id: crypto.randomUUID(),
    createdAt: input.orderDate,
    orderId: input.orderId,
    scoreId: "",
    clientId: "",
    companyName: input.companyName,
    website: `https://${input.domain}`,
    executiveSummary: input.reportSections.executiveSummary,
    citationBaselinePct: Math.round((input.claudeShare + input.chatgptShare) / 2),
    competitorCitationPct: input.competitor1Share,
    pagesAnalyzed: [],
    queryResults: flattenedQueryResults,
    topFixes: parseTopFixes(input.reportSections.topFixes),
    roadmap: [
      { title: "Weeks 1-2", detail: "Fix the highest-impact structural and authority gaps first." },
      { title: "Weeks 3-4", detail: "Publish prompt-aligned commercial and comparison pages." },
      { title: "Weeks 5-8", detail: "Re-measure citation share and expand what is working." },
    ],
  } satisfies AuditRecord;
}

async function ensureStorageBucket() {
  const supabase = createServerClient();

  try {
    await supabase.storage.createBucket("audit-reports", {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
    });
  } catch {
    // Ignore "already exists" and fallback to using the bucket if present.
  }

  return supabase;
}

async function failAuditDelivery(
  orderId: string,
  domain: string,
  step: string,
  error: unknown,
) {
  const message = error instanceof Error ? error.message : "Unknown audit delivery error";

  await upsertAuditResult(orderId, domain, {
    fullReportJson: {
      auditStep: "failed",
      failedStep: step,
      error: message,
      failedAt: new Date().toISOString(),
    },
  });

  await updateOrderDelivery(orderId, {
    status: "failed",
  });
}

export async function processAuditRequested(payload: {
  orderId: string;
  email: string;
  name: string;
  url: string;
}) {
  const order = await getOrderById(payload.orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  const domain = new URL(order.website).hostname.replace(/^www\./, "").toLowerCase();
  try {
    await updateOrderDelivery(payload.orderId, { status: "processing" });
    assertPaidDeliveryConfig();

    const companyName = payload.name || companyNameFromDomain(domain);
    const orderDate = order.createdAt;

    const step1 = await (async () => {
      let homepageText = "";
      let queries = getFallbackQueries();

      try {
        const response = await fetch(order.website, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(10_000),
        });
        const html = await response.text();
        homepageText = stripHtml(html).slice(0, 3000);
      } catch {
        homepageText = "";
      }

      try {
        if (anthropic) {
          const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system:
              "You generate search queries. Return only a JSON array of 20 strings. No other text.",
            messages: [
              {
                role: "user",
                content: `Generate 20 search queries a potential buyer would ask an AI assistant when researching this type of product. Use the page content below to understand the product category and use cases, but DO NOT include the company name, brand name, or domain in any query. Every query must be brand-neutral so we can measure organic citation share.

Page content:
${homepageText}

Mix:
- 8 category/comparison: "Best [type] for [use case]", "Top [type] tools", "Compare [type] options", "Which vendors lead in [space]?"
- 6 problem-based: "How do I [solve problem]?", "How do enterprises handle [challenge]?"
- 4 persona-based: "What do [role] use for [task]?", "What platform do [persona] choose?"
- 2 purchase-trigger: "I need to pick a vendor this quarter — what should I shortlist?", "Must-have features when buying [type]"

IMPORTANT: No query may contain any company or brand name. Return ONLY a JSON array of 20 strings.`,
              },
            ],
          });

          const parsed = safeJsonArray(extractAnthropicText(response));
          if (parsed.length === 20) {
            queries = parsed;
          }
        }
      } catch {
        queries = getFallbackQueries();
      }

      await upsertAuditResult(order.id, domain, {
        fullReportJson: {
          auditStep: "generate-queries",
          generatedQueries: queries,
          queryGeneration: {
            generatedAt: new Date().toISOString(),
            sourceTextPreview: homepageText.slice(0, 500),
          },
        },
      });

      return { queries, orderId: order.id };
    })();

    const step2 = await (async () => {
      const results = await Promise.allSettled(
        step1.queries.map(async (query) => {
          const [claudeResult, chatgptResult] = await Promise.allSettled([
            runClaudeQuery(query, domain),
            runChatGPTQuery(query, domain),
          ]);

          return {
            query,
            claude: claudeResult.status === "fulfilled" ? claudeResult.value : null,
            chatgpt: chatgptResult.status === "fulfilled" ? chatgptResult.value : null,
          } satisfies QueryPairResult;
        }),
      );

      const queryResults = results
        .filter(
          (result): result is PromiseFulfilledResult<QueryPairResult> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      if (!queryResults.length) {
        throw new Error("No audit query results were generated.");
      }

      if (isProductionEnv() && queryResults.every((result) => !result.claude && !result.chatgpt)) {
        throw new Error("All provider query calls failed.");
      }

      const claudeResults = queryResults.filter((r) => r.claude);
      const chatgptResults = queryResults.filter((r) => r.chatgpt);
      const claudeCount = claudeResults.length || 1;
      const chatgptCount = chatgptResults.length || 1;
      const totalCount = claudeCount + chatgptCount;

      const claudeCited = queryResults.filter((result) => result.claude?.cited).length;
      const chatgptCited = queryResults.filter((result) => result.chatgpt?.cited).length;

      // Position-weighted scoring: being mentioned 1st of 5 brands scores
      // higher than being mentioned 5th of 5.
      function positionScore(result: ProviderResult | null): number {
        if (!result?.cited || result.target_position === 0) return 0;
        const total = result.all_brands.length || 1;
        return (total - result.target_position + 1) / total;
      }

      let claudePositionTotal = 0;
      let chatgptPositionTotal = 0;
      for (const r of queryResults) {
        claudePositionTotal += positionScore(r.claude);
        chatgptPositionTotal += positionScore(r.chatgpt);
      }

      // Count competitors per-provider for accurate per-column display
      const claudeCompetitors = queryResults
        .map((r) => r.claude?.competitor_cited)
        .filter((v): v is string => Boolean(v));
      const chatgptCompetitors = queryResults
        .map((r) => r.chatgpt?.competitor_cited)
        .filter((v): v is string => Boolean(v));
      const allCompetitors = [...claudeCompetitors, ...chatgptCompetitors];

      const competitorCounts = allCompetitors.reduce<Record<string, number>>((acc, value) => {
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

      const topCompetitors = Object.entries(competitorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2);

      // Position-weighted citation share: rewards being mentioned first,
      // penalizes being an afterthought in a long list.
      const citationShare = ((claudePositionTotal + chatgptPositionTotal) / totalCount) * 100;
      const competitor1Share = topCompetitors[0] ? (topCompetitors[0][1] / totalCount) * 100 : 0;
      const competitor2Share = topCompetitors[1] ? (topCompetitors[1][1] / totalCount) * 100 : 0;

      // Per-provider competitor shares for accurate PDF display
      function countCompetitorByProvider(
        name: string,
        providerResults: string[],
        providerTotal: number,
      ) {
        const count = providerResults.filter((c) => c === name).length;
        return (count / providerTotal) * 100;
      }

      const comp1Name = topCompetitors[0]?.[0];
      const comp2Name = topCompetitors[1]?.[0];
      const competitor1ClaudeShare = comp1Name ? countCompetitorByProvider(comp1Name, claudeCompetitors, claudeCount) : 0;
      const competitor1ChatgptShare = comp1Name ? countCompetitorByProvider(comp1Name, chatgptCompetitors, chatgptCount) : 0;
      const competitor2ClaudeShare = comp2Name ? countCompetitorByProvider(comp2Name, claudeCompetitors, claudeCount) : 0;
      const competitor2ChatgptShare = comp2Name ? countCompetitorByProvider(comp2Name, chatgptCompetitors, chatgptCount) : 0;

      await upsertAuditResult(order.id, domain, {
        claudeQueries: queryResults.map((result) => ({
          query: result.query,
          ...result.claude,
        })),
        chatgptQueries: queryResults.map((result) => ({
          query: result.query,
          ...result.chatgpt,
        })),
        citationSharePct: citationShare,
        competitor1Domain: topCompetitors[0]?.[0] ?? null,
        competitor1SharePct: competitor1Share,
        competitor2Domain: topCompetitors[1]?.[0] ?? null,
        competitor2SharePct: competitor2Share,
        fullReportJson: {
          auditStep: "run-ai-queries",
          queryResults,
          claudeCited,
          chatgptCited,
          claudeCitationShare: (claudePositionTotal / claudeCount) * 100,
          chatgptCitationShare: (chatgptPositionTotal / chatgptCount) * 100,
        },
      });

      // 95% confidence interval for the citation share based on sample variance
      const perQueryScores = queryResults.flatMap((r) => [
        positionScore(r.claude),
        positionScore(r.chatgpt),
      ]);
      const mean = perQueryScores.reduce((s, v) => s + v, 0) / (perQueryScores.length || 1);
      const variance =
        perQueryScores.reduce((s, v) => s + (v - mean) ** 2, 0) / (perQueryScores.length || 1);
      const stdError = Math.sqrt(variance / (perQueryScores.length || 1));
      const marginOfError = Math.round(stdError * 1.96 * 100);

      return {
        queryResults,
        citationShare,
        topCompetitors,
        claudeCited,
        chatgptCited,
        claudeShare: (claudePositionTotal / claudeCount) * 100,
        chatgptShare: (chatgptPositionTotal / chatgptCount) * 100,
        competitor1Share,
        competitor2Share,
        competitor1ClaudeShare,
        competitor1ChatgptShare,
        competitor2ClaudeShare,
        competitor2ChatgptShare,
        marginOfError,
      };
    })();

    const step3 = await (async () => {
      let bingIndexed = false;
      let bingPageCount = 0;
      let braveIndexed = false;

      try {
        const html = await fetchHtml(
          `https://www.bing.com/search?q=${encodeURIComponent(`site:${domain}`)}`,
          8_000,
        );
        bingPageCount = parseResultCount(html);
        bingIndexed = bingPageCount > 0;
      } catch {
        bingIndexed = false;
        bingPageCount = 0;
      }

      try {
        const html = await fetchHtml(
          `https://search.brave.com/search?q=${encodeURIComponent(`site:${domain}`)}`,
          8_000,
        );
        braveIndexed = html.includes(domain);
      } catch {
        braveIndexed = false;
      }

      await upsertAuditResult(order.id, domain, {
        bingIndexed,
        bingPageCount,
        braveIndexed,
        fullReportJson: {
          auditStep: "index-audit",
          bingIndexed,
          bingPageCount,
          braveIndexed,
        },
      });

      return { bingIndexed, bingPageCount, braveIndexed };
    })();

    const step4 = await (async () => {
      const fallbackSections = fallbackReportSections({
        domain,
        claudeShare: step2.claudeShare,
        claudeCited: step2.claudeCited,
        chatgptShare: step2.chatgptShare,
        chatgptCited: step2.chatgptCited,
        comp1: step2.topCompetitors[0]?.[0] ?? null,
        comp1Count: step2.topCompetitors[0]?.[1] ?? 0,
        bingPageCount: step3.bingPageCount,
        braveIndexed: step3.braveIndexed,
      });

      if (!anthropic) {
        throw new Error("ANTHROPIC_API_KEY is required for audit report generation.");
      }

      try {
        const reportPrompt = `
Write a professional AI visibility audit report.
Be specific and data-driven. Reference exact numbers.
Client: ${domain}

Data:
- Claude citation share: ${step2.claudeShare}% (${step2.claudeCited}/20 queries)
- ChatGPT citation share: ${step2.chatgptShare}% (${step2.chatgptCited}/20 queries)
- Top competitor: ${step2.topCompetitors[0]?.[0] ?? "Unknown"} (cited in ${step2.topCompetitors[0]?.[1] ?? 0}/40 queries)
- Second competitor: ${step2.topCompetitors[1]?.[0] ?? "Unknown"} (cited in ${step2.topCompetitors[1]?.[1] ?? 0}/40 queries)
- Bing indexed pages: ${step3.bingPageCount}
- Brave indexed: ${step3.braveIndexed ? "yes" : "no"}

Sample query results (first 5 of 20):
${step2.queryResults
  .slice(0, 5)
  .map(
    (result) => `Q: "${result.query}"
Claude: ${result.claude?.cited ? "CITED" : "not mentioned"} ${result.claude?.competitor_cited ? `(cited ${result.claude.competitor_cited} instead)` : ""}
Excerpt: "${result.claude?.excerpt?.slice(0, 100) ?? ""}..."`,
  )
  .join("\n\n")}

Write these 4 sections. Use plain text, no markdown:

SECTION 1 - EXECUTIVE SUMMARY
SECTION 2 - WHAT THE GAPS MEAN
SECTION 3 - TOP 5 FIXES
SECTION 4 - 60-DAY PROJECTION
`;

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: reportPrompt }],
        });

        const text = extractAnthropicText(response);
        const reportSections = {
          executiveSummary: extractSection(
            text,
            "SECTION 1 - EXECUTIVE SUMMARY",
            "SECTION 2 - WHAT THE GAPS MEAN",
          ),
          gapAnalysis: extractSection(
            text,
            "SECTION 2 - WHAT THE GAPS MEAN",
            "SECTION 3 - TOP 5 FIXES",
          ),
          topFixes: extractSection(
            text,
            "SECTION 3 - TOP 5 FIXES",
            "SECTION 4 - 60-DAY PROJECTION",
          ),
          projection: extractSection(text, "SECTION 4 - 60-DAY PROJECTION"),
        };

        if (
          !reportSections.executiveSummary ||
          !reportSections.gapAnalysis ||
          !reportSections.topFixes ||
          !reportSections.projection
        ) {
          throw new Error("Anthropic returned incomplete report sections.");
        }

        await upsertAuditResult(order.id, domain, {
          fullReportJson: {
            auditStep: "generate-report-text",
            ...reportSections,
            generatedAt: new Date().toISOString(),
          },
        });

        return reportSections;
      } catch (error) {
        if (isProductionEnv()) {
          throw error;
        }

        await upsertAuditResult(order.id, domain, {
          fullReportJson: {
            auditStep: "generate-report-text",
            ...fallbackSections,
            generatedAt: new Date().toISOString(),
            degradedMode: true,
          },
        });

        return fallbackSections;
      }
    })();

    const step5 = await (async () => {
      const schemaTemplates = buildSchemaTemplates({
        domain,
        companyName,
        companyDescription: step4.executiveSummary,
      });

      const reportData: AuditReportData = {
        domain,
        orderDate,
        claudeCitationShare: step2.claudeShare,
        chatgptCitationShare: step2.chatgptShare,
        claudeCited: step2.claudeCited,
        chatgptCited: step2.chatgptCited,
        competitor1: step2.topCompetitors[0]?.[0] ?? null,
        competitor1Share: step2.competitor1Share,
        competitor1ClaudeShare: step2.competitor1ClaudeShare,
        competitor1ChatgptShare: step2.competitor1ChatgptShare,
        competitor2: step2.topCompetitors[1]?.[0] ?? null,
        competitor2Share: step2.competitor2Share,
        competitor2ClaudeShare: step2.competitor2ClaudeShare,
        competitor2ChatgptShare: step2.competitor2ChatgptShare,
        queryResults: step2.queryResults,
        bingIndexed: step3.bingIndexed,
        bingPageCount: step3.bingPageCount,
        braveIndexed: step3.braveIndexed,
        executiveSummary: step4.executiveSummary,
        gapAnalysis: step4.gapAnalysis,
        topFixes: step4.topFixes,
        projection: step4.projection,
        generatedAt: new Date().toISOString(),
        marginOfError: step2.marginOfError,
        schemaTemplates,
        auditStep: "generate-pdf",
      };

      const compatibilityRecord = buildLegacyAuditRecord({
        orderId: order.id,
        domain,
        orderDate,
        companyName,
        queryResults: step2.queryResults,
        reportSections: step4,
        claudeShare: step2.claudeShare,
        chatgptShare: step2.chatgptShare,
        competitor1Share: step2.competitor1Share,
      });

      const pdfBuffer = await renderAuditDeliveryPdf(reportData);

      await upsertAuditResult(order.id, domain, {
        fullReportJson: {
          auditStep: "generate-pdf",
          ...reportData,
          appRecord: compatibilityRecord,
        },
      });

      return { reportData, pdfBuffer };
    })();

    const step6 = await (async () => {
      let reportUrl = `${appEnv.appUrl}/report/${order.stripePaymentIntentId || order.id}`;
      const supabase = await ensureStorageBucket();
      const filePath = `${order.id}/report.pdf`;

      const upload = await supabase.storage
        .from("audit-reports")
        .upload(filePath, step5.pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (upload.error) {
        throw new Error(`PDF upload failed: ${upload.error.message}`);
      }

      const pdfUrl = `${appEnv.appUrl}/api/reports/${order.stripePaymentIntentId || order.id}/download`;
      reportUrl = `${appEnv.appUrl}/report/${order.stripePaymentIntentId || order.id}`;

      await upsertAuditResult(order.id, domain, {
        fullReportJson: {
          auditStep: "delivered",
          pdfUrl,
          reportUrl,
        },
      });

      await sendAuditDeliveredEmail({
        email: order.email,
        name: order.name || "there",
        domain,
        reportUrl,
        pdfUrl,
        accountUrl: `${appEnv.appUrl}/account`,
        claudeCited: step2.claudeCited,
        chatgptCited: step2.chatgptCited,
        competitorName: step2.topCompetitors[0]?.[0] ?? null,
        competitorCitations: step2.topCompetitors[0]?.[1] ?? 0,
        executiveSummary: step4.executiveSummary,
      });

      await updateOrderDelivery(order.id, {
        deliveredAt: new Date(),
        reportUrl,
        status: "delivered",
      });

      return { reportUrl, pdfUrl };
    })();

    return step6;
  } catch (error) {
    await failAuditDelivery(order.id, domain, "audit-requested", error);
    throw error;
  }
}

export const auditRequested = inngest.createFunction(
  { id: "audit-requested" },
  { event: "audit/requested" },
  async ({ event, step }) => {
    const payload = event.data as {
      orderId: string;
      email: string;
      name: string;
      url: string;
    };

    return step.run("audit-requested", async () => processAuditRequested(payload));
  },
);
