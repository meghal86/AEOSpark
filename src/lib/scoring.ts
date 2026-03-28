import { load } from "cheerio";

import type {
  Recommendation,
  ScoreDimension,
  ScoreDimensionKey,
  ScoreRecord,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

export type CrawlPage = {
  html: string;
  url: string;
};

export type CrawlResult = {
  html: string;
  url: string;
  domain: string;
  robotsTxt: string;
  hasLlmsTxt: boolean;
  pages: CrawlPage[];
  crawl_status: "success" | "partial" | "blocked";
};

export type ScoreResult = {
  total: number;
  grade: string;
  dimensions: {
    crawler_access: number;
    structured_data: number;
    content_arch: number;
    pricing: number;
    authority: number;
    bing_presence: number;
    brand_footprint: number;
  };
  diagnoses: Record<string, string>;
  crawl_status: "success" | "partial" | "blocked";
};

type StructuredDataStats = {
  otherTypes: string[];
  organizationFound: boolean;
  faqFound: boolean;
  productFound: boolean;
  softwareApplicationFound: boolean;
  microdataFound: boolean;
  score: number;
  pageCount: number;
  discoveredTypes: string[];
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

const DIMENSION_META: Record<
  keyof ScoreResult["dimensions"],
  { key: ScoreDimensionKey; label: string; weight: number }
> = {
  crawler_access: {
    key: "crawler-access",
    label: "AI Crawler Access",
    weight: 15,
  },
  structured_data: {
    key: "structured-data",
    label: "Structured Data",
    weight: 20,
  },
  content_arch: {
    key: "content-architecture",
    label: "Content Architecture",
    weight: 20,
  },
  pricing: {
    key: "pricing-visibility",
    label: "Pricing Visibility",
    weight: 15,
  },
  authority: {
    key: "authority-signals",
    label: "Authority Signals",
    weight: 15,
  },
  bing_presence: {
    key: "bing-presence",
    label: "Bing Presence",
    weight: 10,
  },
  brand_footprint: {
    key: "brand-footprint",
    label: "Brand Footprint",
    weight: 5,
  },
};

function domainFromUrl(url: string) {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

function companyNameFromDomain(domain: string) {
  return domain
    .split(".")[0]
    ?.split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getGrade(total: number) {
  if (total >= 90) return "A";
  if (total >= 75) return "B";
  if (total >= 60) return "C";
  if (total >= 45) return "D";
  return "F";
}

function safeText($: ReturnType<typeof load>) {
  return normalizeWhitespace($.root().text());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseJsonLdTypes(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.flatMap(parseJsonLdTypes);
  }
  if (typeof input !== "object") {
    return [];
  }

  const record = input as Record<string, unknown>;
  const ownType = record["@type"];
  const graph = record["@graph"];
  const nested = Object.values(record).flatMap((value) =>
    typeof value === "object" ? parseJsonLdTypes(value) : [],
  );

  const ownTypes =
    typeof ownType === "string"
      ? [ownType]
      : Array.isArray(ownType)
        ? ownType.filter((value): value is string => typeof value === "string")
        : [];

  return [...ownTypes, ...parseJsonLdTypes(graph), ...nested];
}

function analyzeStructuredData(homepageHtml: string, pages: CrawlPage[]) {
  const discoveredTypes = new Set<string>();
  let pageCount = 0;
  let microdataFound = false;

  for (const html of [homepageHtml, ...pages.slice(0, 3).map((page) => page.html)]) {
    const $ = load(html);
    const scripts = $('script[type="application/ld+json"]').toArray();
    const hasSchemaAttributes =
      $("[itemtype*='schema.org'], [itemscope], [itemprop]").length > 0 ||
      $("meta[property^='og:'], meta[name='application-name'], meta[name='apple-itunes-app']").length > 0;
    if (scripts.length || hasSchemaAttributes) {
      pageCount += 1;
    }
    if (hasSchemaAttributes) {
      microdataFound = true;
    }

    for (const script of scripts) {
      const raw = $(script).contents().text().trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        for (const schemaType of parseJsonLdTypes(parsed)) {
          discoveredTypes.add(schemaType);
        }
      } catch {
        continue;
      }
    }
  }

  const types = [...discoveredTypes];
  const faqFound = types.some((type) => /FAQPage/i.test(type));
  const organizationFound = types.some((type) => /Organization/i.test(type));
  const softwareApplicationFound = types.some((type) =>
    /SoftwareApplication/i.test(type),
  );
  const productFound = types.some((type) => /Product/i.test(type));
  const otherTypes = types.filter(
    (type) =>
      !/FAQPage/i.test(type) &&
      !/Organization/i.test(type) &&
      !/SoftwareApplication/i.test(type) &&
      !/Product/i.test(type),
  );

  let score = 0;
  if (faqFound) score += 8;
  if (organizationFound) score += 6;
  if (softwareApplicationFound || productFound) score += 4;
  if (!faqFound && !organizationFound && !softwareApplicationFound && !productFound && otherTypes.length) {
    score += 2;
  }
  if (score === 0 && microdataFound) {
    score += 2;
  }

  return {
    discoveredTypes: types,
    faqFound,
    microdataFound,
    organizationFound,
    otherTypes,
    pageCount,
    productFound,
    score,
    softwareApplicationFound,
  } satisfies StructuredDataStats;
}

function botAllowed(robotsTxt: string, bot: string) {
  if (!robotsTxt.trim()) {
    return true;
  }

  const lines = robotsTxt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"));

  let currentAgents: string[] = [];
  let matchedBlock = false;
  let disallowAll = false;

  for (const line of lines) {
    const [rawDirective, ...rawValue] = line.split(":");
    if (!rawDirective || rawValue.length === 0) {
      continue;
    }

    const directive = rawDirective.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    if (directive === "user-agent") {
      const normalized = value.toLowerCase();
      if (!currentAgents.length || matchedBlock) {
        currentAgents = [normalized];
      } else {
        currentAgents.push(normalized);
      }
      matchedBlock = currentAgents.includes(bot.toLowerCase());
      continue;
    }

    if (directive === "disallow" && matchedBlock) {
      if (value === "/") {
        disallowAll = true;
      }
      if (value === "") {
        disallowAll = false;
      }
    }

    if (directive === "allow" && matchedBlock && value === "/") {
      disallowAll = false;
    }
  }

  return !disallowAll;
}

function countFaqPairs(
  homepageHtml: string,
  pages: CrawlPage[],
  structuredData: StructuredDataStats,
) {
  const pagesToInspect = [homepageHtml, ...pages.slice(0, 3).map((page) => page.html)];
  let total = 0;

  for (const html of pagesToInspect) {
    const $ = load(html);
    const faqBlocks = $('[class*="faq"], [class*="FAQ"]').length;
    const detailsPairs = $("details summary").length;
    const questionHeadings = $("h2, h3, h4")
      .toArray()
      .map((entry) => normalizeWhitespace($(entry).text()))
      .filter((value) => value.endsWith("?")).length;

    total += faqBlocks + detailsPairs + questionHeadings;
  }

  if (structuredData.faqFound) {
    total += 8;
  }

  return total;
}

function answerFirstParagraphScore(
  homepageHtml: string,
  domain: string,
) {
  const $ = load(homepageHtml);
  const firstParagraph = normalizeWhitespace($("p").first().text());
  if (!firstParagraph) {
    return { matched: false, paragraph: "" };
  }

  const words = firstParagraph.split(/\s+/);
  const withinWindow = words.slice(0, 60).join(" ");
  const hasSentence = /\./.test(withinWindow);
  const lower = withinWindow.toLowerCase();
  const startsBadly =
    lower.startsWith("we are") ||
    lower.startsWith("welcome") ||
    lower.startsWith(domain.split(".")[0].toLowerCase());

  return {
    matched: hasSentence && !startsBadly,
    paragraph: firstParagraph,
  };
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function extractXmlLocValues(xml: string, tagName: "url" | "sitemap") {
  const pattern = new RegExp(
    `<${tagName}[^>]*>[\\s\\S]*?<loc>(.*?)<\\/loc>[\\s\\S]*?<\\/${tagName}>`,
    "gi",
  );

  return unique(
    [...xml.matchAll(pattern)]
      .map((match) => match[1]?.trim())
      .filter((value): value is string => Boolean(value)),
  );
}

async function estimateIndexedPagesFromSitemaps(origin: string) {
  const candidateSitemaps = new Set<string>([`${origin}/sitemap.xml`]);

  try {
    const robotsTxt = await fetchText(`${origin}/robots.txt`);
    for (const line of robotsTxt.split("\n")) {
      const match = line.match(/^Sitemap:\s*(https?:\/\/\S+)/i);
      if (match?.[1]) {
        candidateSitemaps.add(match[1].trim());
      }
    }
  } catch {
    // fall back to the default sitemap location
  }

  const queue = [...candidateSitemaps].slice(0, 5);
  const visited = new Set<string>();
  const discoveredUrls = new Set<string>();

  while (queue.length && visited.size < 5 && discoveredUrls.size < 10_000) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);

    try {
      const xml = await fetchText(sitemapUrl);
      for (const url of extractXmlLocValues(xml, "url")) {
        discoveredUrls.add(url);
      }

      for (const nested of extractXmlLocValues(xml, "sitemap")) {
        if (nested.startsWith(origin) && !visited.has(nested) && queue.length < 5) {
          queue.push(nested);
        }
      }
    } catch {
      continue;
    }
  }

  return discoveredUrls.size;
}

async function checkPricingVisibility(baseUrl: string, crawledPages: CrawlPage[]) {
  const origin = new URL(baseUrl).origin;
  const candidates = ["/pricing", "/plans", "/price"];
  let accessiblePage: string | null = null;
  let pricingText = "";
  let blockedByContactOnly = false;

  for (const path of candidates) {
    const candidateUrl = `${origin}${path}`;
    try {
      const html = await fetchText(candidateUrl);
      const $ = load(html);
      const text = safeText($).toLowerCase();
      const redirectedToLogin =
        /login|sign in|sign-in/.test(text.slice(0, 300)) &&
        !$("body").text().includes("$");

      if (!redirectedToLogin) {
        accessiblePage = candidateUrl;
        pricingText = text;
        blockedByContactOnly =
          /contact us|talk to sales|request a quote/.test(text) &&
          !/[$€£]|per month|per year/.test(text);
        break;
      }
    } catch {
      continue;
    }
  }

  const allText = `${pricingText} ${crawledPages
    .map((page) => normalizeWhitespace(load(page.html).root().text()).toLowerCase())
    .join(" ")}`;
  const hasFreeTrial =
    /free trial|free forever|freemium/.test(pricingText) ||
    /free trial|free forever|freemium/.test(allText);

  let score = 0;
  if (accessiblePage && !blockedByContactOnly) {
    score += 8;
    if (/[$€£]|per month|per year/.test(pricingText)) {
      score += 5;
    }
    if (hasFreeTrial) {
      score += 2;
    }
  }

  return {
    accessiblePage,
    blockedByContactOnly,
    hasFreeTrial,
    pricingText,
    score,
  };
}

function findAuthoritySignals(homepageHtml: string, pages: CrawlPage[]) {
  const pagesToInspect = [homepageHtml, ...pages.slice(0, 4).map((page) => page.html)];
  const combinedHtml = pagesToInspect.join("\n");
  const combinedText = normalizeWhitespace(load(combinedHtml).root().text());
  const leadershipPatterns = [
    /\b(?:ceo|founder|co-founder|cofounder|chief executive officer)\b[^A-Za-z]{0,30}([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})[^.]{0,40}\b(?:ceo|founder|co-founder|cofounder|chief executive officer)\b/i,
    /\bfounded by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/i,
  ];
  const leadershipMatch = leadershipPatterns
    .map((pattern) => combinedText.match(pattern))
    .find(Boolean);
  const customerCountMatch = combinedText.match(
    /\b(?:over\s+|more than\s+|trusted by\s+)?[\d,.]+(?:\+|k|m)?\s+(?:customers|companies|users|teams|businesses)\b/i,
  );
  const externalStatsMatch = combinedText.match(
    /\b(?:according to|study shows|research finds|% of)\b.{0,120}/i,
  );

  const $ = load(combinedHtml);
  let reviewBadgeFound = false;
  $("a[href], img[src]").each((_, element) => {
    const href = $(element).attr("href") || $(element).attr("src") || "";
    if (/g2\.com|capterra\.com|trustpilot\.com/i.test(href)) {
      reviewBadgeFound = true;
    }
  });

  let score = 0;
  if (leadershipMatch) score += 4;
  if (customerCountMatch) score += 3;
  if (reviewBadgeFound) score += 4;
  if (externalStatsMatch) score += 4;

  return {
    customerCountMatch,
    externalStatsMatch,
    leadershipMatch,
    reviewBadgeFound,
    score,
  };
}

function parseBingResultCount(html: string) {
  const text = normalizeWhitespace(load(html).root().text());
  const match =
    text.match(/([\d,]+)\s+results/i) ||
    text.match(/About\s+([\d,]+)\s+results/i) ||
    text.match(/([\d,]+)\s+RESULTS/i) ||
    text.match(/([\d,]+)\s+resultados/i);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, ""));
}

function inferBingResultCount(html: string, domain: string) {
  const $ = load(html);
  const domainPattern = new RegExp(escapeRegExp(domain), "i");

  const resultAnchors = $("li.b_algo, .b_algo, main li, main article, a[href]")
    .toArray()
    .map((entry) => $(entry).text())
    .filter((text) => domainPattern.test(text)).length;

  if (resultAnchors >= 10) return 1_000;
  if (resultAnchors >= 5) return 100;
  if (resultAnchors >= 1) return 10;
  if (html.toLowerCase().includes(domain.toLowerCase())) return 1;
  return 0;
}

async function checkBingPresence(domain: string) {
  const origin = `https://${domain}`;
  try {
    const html = await fetchText(`https://www.bing.com/search?q=${encodeURIComponent(`site:${domain}`)}`);
    const explicitCount = parseBingResultCount(html);
    const sitemapCount = explicitCount > 0 ? 0 : await estimateIndexedPagesFromSitemaps(origin);
    const visibleResultsCount =
      explicitCount > 0 || sitemapCount > 0 ? 0 : inferBingResultCount(html, domain);
    const count = explicitCount || sitemapCount || visibleResultsCount;
    let score = 0;
    if (count >= 10_000) score = 10;
    else if (count >= 1_000) score = 8;
    else if (count >= 100) score = 5;
    else if (count >= 1) score = 3;

    return {
      count,
      estimated: explicitCount === 0,
      source:
        explicitCount > 0
          ? "bing"
          : sitemapCount > 0
            ? "sitemap"
            : visibleResultsCount > 0
              ? "visible_results"
              : "unavailable",
      score,
    };
  } catch {
    return {
      count: 0,
      estimated: true,
      source: "unavailable",
      score: 3,
    };
  }
}

async function checkBrandFootprint(companyName: string, domain: string) {
  const companyPattern = new RegExp(escapeRegExp(companyName), "i");
  const domainPattern = new RegExp(escapeRegExp(domain.replace(/^www\./, "")), "i");
  const queries = [
    `${companyName} review`,
    `"${companyName}" review`,
    `${companyName} reddit`,
    `${companyName} wikipedia`,
    `${domain} review`,
  ];

  let aggregateHtml = "";

  try {
    for (const query of queries.slice(0, 2)) {
      const html = await fetchText(
        `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`,
      );
      aggregateHtml += ` ${html}`;
    }
  } catch {
    // fall through to alternate search source
  }

  if (!aggregateHtml.trim()) {
    try {
      for (const query of queries) {
        const html = await fetchText(
          `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        );
        aggregateHtml += ` ${html}`;
      }
    } catch {
      return {
        hasKnowledgeSource: false,
        hasReddit: false,
        hasReviewSite: false,
        score: 1,
      };
    }
  }

  const lower = aggregateHtml.toLowerCase();
  let hasReviewSite = /g2\.com|capterra\.com|trustpilot\.com/.test(lower);
  let hasReddit = /reddit\.com/.test(lower);
  let hasKnowledgeSource = /wikipedia\.org/.test(lower);

  if (!hasReviewSite) {
    try {
      const reviewChecks = await Promise.allSettled([
        fetchText(`https://www.g2.com/search?query=${encodeURIComponent(companyName)}`),
        fetchText(`https://www.capterra.com/search/?query=${encodeURIComponent(companyName)}`),
        fetchText(`https://www.trustpilot.com/search?query=${encodeURIComponent(companyName)}`),
      ]);

      hasReviewSite = reviewChecks.some(
        (result) =>
          result.status === "fulfilled" &&
          (companyPattern.test(result.value) || domainPattern.test(result.value)),
      );
    } catch {
      // Ignore direct review-site lookup failures.
    }
  }

  if (!hasReddit) {
    try {
      const response = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(companyName)}&limit=5&sort=relevance&t=all`,
        {
          headers: {
            "user-agent": USER_AGENT,
            accept: "application/json,text/plain,*/*",
          },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          data?: { children?: Array<{ data?: { title?: string; url?: string; selftext?: string } }> };
        };
        hasReddit = Boolean(
          payload.data?.children?.some((child) => {
            const blob = `${child.data?.title || ""} ${child.data?.url || ""} ${child.data?.selftext || ""}`;
            return companyPattern.test(blob) || domainPattern.test(blob);
          }),
        );
      }
    } catch {
      // Ignore Reddit lookup failures.
    }
  }

  if (!hasKnowledgeSource) {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(companyName)}&limit=5`,
        {
          headers: {
            "user-agent": USER_AGENT,
            accept: "application/json,text/plain,*/*",
          },
          signal: AbortSignal.timeout(10_000),
        },
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          pages?: Array<{ title?: string; excerpt?: string }>;
        };
        hasKnowledgeSource = Boolean(
          payload.pages?.some((page) => {
            const blob = `${page.title || ""} ${page.excerpt || ""}`;
            return companyPattern.test(blob) || domainPattern.test(blob);
          }),
        );
      }
    } catch {
      // Ignore Wikipedia lookup failures.
    }
  }

  let score = 0;
  if (hasReviewSite) score += 2;
  if (hasReddit) score += 2;
  if (hasKnowledgeSource) score += 1;

  return {
    hasKnowledgeSource,
    hasReddit,
    hasReviewSite,
    score,
  };
}

function buildDimension(
  resultKey: keyof ScoreResult["dimensions"],
  score: number,
  diagnosis: string,
  evidence: string[],
) {
  const meta = DIMENSION_META[resultKey];
  return {
    key: meta.key,
    label: meta.label,
    weight: meta.weight,
    score,
    diagnosis,
    evidence,
  } satisfies ScoreDimension;
}

function buildRecommendations(
  dimensions: ScoreDimension[],
  companyName: string,
): Recommendation[] {
  const sorted = [...dimensions].sort(
    (left, right) => left.score / left.weight - right.score / right.weight,
  );

  const base = sorted.map((dimension, index) => ({
    id: `${dimension.key}-${index + 1}`,
    title: `Improve ${dimension.label.toLowerCase()}`,
    detail: dimension.diagnosis,
    impact: index < 4 ? "High" : "Medium",
    effort:
      dimension.weight >= 20 ? "Medium" : dimension.weight <= 10 ? "Low" : "High",
    locked: index >= 3,
  })) satisfies Recommendation[];

  while (base.length < 10) {
    base.push({
      id: `aeo-${base.length + 1}`,
      title: `Add another citation-ready page for ${companyName}`,
      detail:
        "Publish one direct-answer page for a high-intent query, add proof, then re-run the score.",
      impact: "Medium",
      effort: "Medium",
      locked: base.length >= 3,
    });
  }

  return base.slice(0, 10);
}

function verdictFromTotal(total: number) {
  if (total >= 75) {
    return "AI agents can resolve the business, but you still have index and proof gaps to close.";
  }
  if (total >= 60) {
    return "The site is partially readable by AI, but citation visibility is inconsistent and fragile.";
  }
  if (total >= 45) {
    return "The site has enough public content to score, but AI visibility is weak across high-intent queries.";
  }
  return "The site is effectively invisible to AI assistants on the signals that drive citations.";
}

function executiveSummary(
  companyName: string,
  total: number,
  weakest: ScoreDimension[],
) {
  const weakAreas = weakest.map((dimension) => dimension.label.toLowerCase()).join(" and ");
  return `${companyName} scored ${total}/100. The biggest visibility constraints are ${weakAreas}, which directly limit how often AI assistants can cite the company in answer flows.`;
}

function evidenceForDimension(
  dimensionKey: keyof ScoreResult["dimensions"],
  crawlResult: CrawlResult,
) {
  switch (dimensionKey) {
    case "crawler_access":
      return [
        "Reviewed robots.txt for GPTBot, ClaudeBot, PerplexityBot, and Bingbot rules.",
        crawlResult.hasLlmsTxt ? "llms.txt was found at the site root." : "No llms.txt file was found at the site root.",
      ];
    case "structured_data":
      return [
        "Parsed homepage JSON-LD blocks for FAQPage, Organization, Product, and SoftwareApplication schema.",
        "Stored schema score only from parseable structured data, not visual markup guesses.",
      ];
    case "content_arch":
      return [
        "Checked the first paragraph, heading hierarchy, FAQ density, and comparison-table presence.",
        `Scanned the homepage plus ${Math.min(crawlResult.pages.length, 3)} additional linked pages for answer structure.`,
      ];
    case "pricing":
      return [
        "Tested /pricing, /plans, and /price for public access without login.",
        "Looked for visible currency, billing terms, and free-trial language.",
      ];
    case "authority":
      return [
        "Looked for named leadership, quantified customer proof, review badges, and cited statistics.",
        `Scanned homepage copy plus ${Math.min(crawlResult.pages.length, 4)} linked pages for authority signals.`,
      ];
    case "bing_presence":
      return [
        `Queried Bing for site:${crawlResult.domain}.`,
        "Converted result-count visibility into the 0-10 Bing presence score.",
      ];
    case "brand_footprint":
      return [
        `Queried Google for ${companyNameFromDomain(crawlResult.domain)} review terms.`,
        "Checked search results for review sites, Reddit discussion, and Wikipedia presence.",
      ];
    default:
      return [];
  }
}

export async function scoreUrl(crawlResult: CrawlResult): Promise<ScoreResult> {
  const structuredData = analyzeStructuredData(crawlResult.html, crawlResult.pages);
  const $ = load(crawlResult.html);
  const domain = crawlResult.domain || domainFromUrl(crawlResult.url);
  const companyName = companyNameFromDomain(domain);

  const crawlerBots = ["GPTBot", "ClaudeBot", "PerplexityBot", "Bingbot"] as const;
  const allowedBots = crawlerBots.filter((bot) => botAllowed(crawlResult.robotsTxt, bot));
  const crawlerAccessScore = allowedBots.length * 3 + (crawlResult.hasLlmsTxt ? 3 : 0);

  const answerFirst = answerFirstParagraphScore(crawlResult.html, domain);
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const faqPairs = countFaqPairs(crawlResult.html, crawlResult.pages, structuredData);
  const hasComparisonTable =
    $("table").length > 0 ||
    /compar/i.test(crawlResult.html) ||
    crawlResult.pages.some((page) => /compar/i.test(page.html) || load(page.html)("table").length > 0);

  let contentArchScore = 0;
  if (answerFirst.matched) contentArchScore += 6;
  if (h2Count > 0 && h3Count > 0) contentArchScore += 4;
  if (faqPairs >= 30) contentArchScore += 6;
  else if (faqPairs >= 15) contentArchScore += 4;
  else if (faqPairs >= 5) contentArchScore += 2;
  else if (faqPairs >= 1) contentArchScore += 1;
  if (hasComparisonTable) contentArchScore += 4;

  const pricing = await checkPricingVisibility(crawlResult.url, crawlResult.pages);
  const authority = findAuthoritySignals(crawlResult.html, crawlResult.pages);
  const bing = await checkBingPresence(domain);
  const brand = await checkBrandFootprint(companyName, domain);

  const total =
    crawlerAccessScore +
    structuredData.score +
    contentArchScore +
    pricing.score +
    authority.score +
    bing.score +
    brand.score;

  return {
    total,
    grade: getGrade(total),
    dimensions: {
      crawler_access: crawlerAccessScore,
      structured_data: structuredData.score,
      content_arch: contentArchScore,
      pricing: pricing.score,
      authority: authority.score,
      bing_presence: bing.score,
      brand_footprint: brand.score,
    },
    diagnoses: {
      crawler_access: `${allowedBots.length}/4 named AI crawlers appear allowed in robots.txt (${allowedBots.join(", ") || "none"}). llms.txt ${crawlResult.hasLlmsTxt ? "exists" : "is missing"}, so crawler access scored ${crawlerAccessScore}/15.`,
      structured_data:
        structuredData.score > 0
          ? `Detected ${structuredData.discoveredTypes.length ? "schema types" : "machine-readable schema signals"}: ${[
              structuredData.faqFound ? "FAQPage" : null,
              structuredData.organizationFound ? "Organization" : null,
              structuredData.softwareApplicationFound ? "SoftwareApplication" : null,
              structuredData.productFound ? "Product" : null,
              structuredData.microdataFound ? "Schema.org microdata/meta tags" : null,
              ...structuredData.otherTypes,
            ]
              .filter(Boolean)
              .join(", ")} across ${structuredData.pageCount} page${structuredData.pageCount === 1 ? "" : "s"}. Structured data scored ${structuredData.score}/20.`
          : "No parseable JSON-LD schema or schema.org-style microdata was found across the homepage and sampled commercial pages, so AI systems have little machine-readable product or entity context.",
      content_arch: `First paragraph ${answerFirst.matched ? "is" : "is not"} answer-first. Found ${h2Count} H2 tags, ${h3Count} H3 tags, approximately ${faqPairs} FAQ-style pairs, and ${hasComparisonTable ? "a" : "no"} comparison table, for ${contentArchScore}/20.`,
      pricing:
        pricing.accessiblePage && !pricing.blockedByContactOnly
          ? `Public pricing page found at ${pricing.accessiblePage}. ${/[$€£]|per month|per year/.test(pricing.pricingText) ? "Explicit price language is visible." : "No explicit dollar amount is visible."} ${pricing.hasFreeTrial ? "Free-trial language is present." : "No free-trial language was found."}`
          : pricing.blockedByContactOnly
            ? 'Pricing appears to be hidden behind "contact sales" language with no public dollar amounts, which scored 0/15.'
            : "No public pricing page was found at /pricing, /plans, or /price, so pricing visibility scored 0/15.",
      authority: `Authority scored ${authority.score}/15. ${authority.leadershipMatch ? `Leadership mention found (${authority.leadershipMatch[0]}).` : "No named founder or CEO match found."} ${authority.customerCountMatch ? `Customer proof found (${authority.customerCountMatch[0]}).` : "No quantified customer proof found."} ${authority.reviewBadgeFound ? "Review-platform badge detected." : "No G2, Capterra, or Trustpilot badge detected."} ${authority.externalStatsMatch ? "Externally cited statistics were found." : "No cited external statistics were found."}`,
      bing_presence: !bing.estimated
        ? `Only ${bing.count.toLocaleString()} pages appear indexed on Bing, which scored ${bing.score}/10. ChatGPT visibility is constrained when Bing coverage is shallow.`
        : bing.source === "sitemap"
          ? `Bing returned no explicit result count, so AEOSpark estimated approximately ${bing.count.toLocaleString()} crawlable page${bing.count === 1 ? "" : "s"} from the site's sitemap footprint and assigned ${bing.score}/10.`
          : bing.source === "visible_results"
            ? `Bing returned no explicit result count, so AEOSpark inferred approximately ${bing.count.toLocaleString()} indexed page${bing.count === 1 ? "" : "s"} from visible results and assigned ${bing.score}/10.`
            : "Bing presence check was unavailable, so AEOSpark assigned the conservative fallback score of 3/10.",
      brand_footprint: `Brand-footprint scored ${brand.score}/5. ${brand.hasReviewSite ? "Review-platform visibility was found in search results." : "No G2, Capterra, or Trustpilot result was found."} ${brand.hasReddit ? "Reddit discussion exists." : "No Reddit discussion result was found."} ${brand.hasKnowledgeSource ? "Wikipedia presence exists." : "No Wikipedia result was found."}`,
    },
    crawl_status: crawlResult.crawl_status,
  };
}

export function scoreResultToRecord(input: {
  createdAt?: string;
  crawlResult: CrawlResult;
  scoreId: string;
  scoreResult: ScoreResult;
}) {
  const { crawlResult, scoreId, scoreResult } = input;
  const companyName = companyNameFromDomain(crawlResult.domain);

  const dimensions = (
    Object.keys(scoreResult.dimensions) as Array<keyof ScoreResult["dimensions"]>
  ).map((dimensionKey) =>
    buildDimension(
      dimensionKey,
      scoreResult.dimensions[dimensionKey],
      scoreResult.diagnoses[dimensionKey],
      evidenceForDimension(dimensionKey, crawlResult),
    ),
  );

  const weakest = [...dimensions]
    .sort((left, right) => left.score / left.weight - right.score / right.weight)
    .slice(0, 2);

  return {
    id: scoreId,
    createdAt: input.createdAt ?? new Date().toISOString(),
    publicSlug: `${slugify(companyName)}-${scoreId.slice(0, 8)}`,
    url: crawlResult.url,
    companyName,
    overallScore: scoreResult.total,
    verdict: verdictFromTotal(scoreResult.total),
    executiveSummary: executiveSummary(companyName, scoreResult.total, weakest),
    crawlStatus:
      scoreResult.crawl_status === "success"
        ? "live"
        : scoreResult.crawl_status,
    crawlNotes: [
      scoreResult.diagnoses.crawler_access,
      scoreResult.crawl_status === "blocked"
        ? "The crawler was partially blocked, so the score is conservative."
        : scoreResult.crawl_status === "partial"
          ? "The crawl timed out early, so this score is based on partial coverage."
          : "Live crawl completed successfully.",
    ],
    teaserPdfReady: true,
    calendlyUrl: "https://calendly.com",
    dimensions,
    recommendations: buildRecommendations(dimensions, companyName),
  } satisfies ScoreRecord;
}
