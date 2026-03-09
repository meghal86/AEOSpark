import { load } from "cheerio";

import type {
  ComparisonScore,
  Recommendation,
  ScoreDimension,
  ScoreDimensionKey,
  ScoreRecord,
} from "@/lib/types";

type RawPage = {
  html: string;
  url: string;
  crawlStatus: "live" | "fallback";
  crawlNotes: string[];
};

const DIMENSION_WEIGHTS: Record<ScoreDimensionKey, number> = {
  "structured-data": 25,
  "content-clarity": 20,
  "pricing-transparency": 20,
  "faq-coverage": 20,
  "trust-signals": 10,
  "citation-readiness": 5,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  return new URL(withProtocol).toString();
}

async function fetchWebsiteHtml(input: string): Promise<RawPage> {
  const crawlNotes: string[] = [];
  const url = normalizeUrl(input);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; AEOSparkBot/1.0; +https://aeospark.com)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(`Remote site responded with ${response.status}.`);
    }

    const html = await response.text();
    if (!html.trim()) {
      throw new Error("Remote site returned an empty document.");
    }

    crawlNotes.push("Live crawl completed.");
    return {
      html,
      url,
      crawlStatus: "live",
      crawlNotes,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown crawl failure.";
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    crawlNotes.push(`Live crawl unavailable: ${message}`);
    crawlNotes.push(
      "Fallback heuristic used. Scores are directional until a live crawl succeeds.",
    );

    return {
      url,
      crawlStatus: "fallback",
      crawlNotes,
      html: `
        <html>
          <body>
            <main>
              <h1>${hostname}</h1>
              <section>
                <h2>Pricing</h2>
                <p>Talk to sales for custom pricing.</p>
              </section>
              <section>
                <h2>Frequently asked questions</h2>
                <h3>What does ${hostname} do?</h3>
                <p>${hostname} helps teams improve performance.</p>
                <h3>How quickly can customers launch?</h3>
                <p>Most customers launch in a few weeks.</p>
              </section>
              <section>
                <h2>Trusted by teams</h2>
                <p>Customer stories, reviews, and leadership bios available upon request.</p>
              </section>
            </main>
          </body>
        </html>
      `,
    };
  }
}

function detectCompanyName($: ReturnType<typeof load>, url: string) {
  const title = $("title").first().text().trim();
  const h1 = $("h1").first().text().trim();
  const hostname = new URL(url).hostname.replace(/^www\./, "");

  const raw = title || h1 || hostname;
  return raw.split(/[|\-–:]/)[0]?.trim() || hostname;
}

function summarizeVerdict(score: number) {
  if (score >= 75) {
    return "This site is already readable by AI agents, but there is still room to out-position competitors on structure and proof.";
  }

  if (score >= 50) {
    return "This site has enough surface area for AI agents to parse, but important buying signals are inconsistent or buried.";
  }

  return "This site is hard for AI agents to cite reliably. Key answers, proof points, or structure are either missing or too vague.";
}

function buildDimension(
  key: ScoreDimensionKey,
  label: string,
  score: number,
  diagnosis: string,
  evidence: string[],
): ScoreDimension {
  return {
    key,
    label,
    weight: DIMENSION_WEIGHTS[key],
    score: clamp(score, 0, DIMENSION_WEIGHTS[key]),
    diagnosis,
    evidence,
  };
}

function analyzeStructuredData(html: string) {
  const schemaTypes = [
    "Organization",
    "Product",
    "FAQPage",
    "HowTo",
    "BreadcrumbList",
  ];

  const matched = schemaTypes.filter((schemaType) =>
    new RegExp(`"@type"\\s*:\\s*"${schemaType}"`, "i").test(html),
  );

  const missing = schemaTypes.filter((schemaType) => !matched.includes(schemaType));
  const score = matched.length * 5;
  const diagnosis =
    matched.length >= 4
      ? "Core schema coverage is present, so AI systems can resolve entity, product, and FAQ context."
      : "Schema coverage is incomplete. AI systems are missing explicit machine-readable context on core pages.";

  return buildDimension(
    "structured-data",
    "Structured Data",
    score,
    diagnosis,
    [
      matched.length
        ? `Detected schema: ${matched.join(", ")}.`
        : "No target JSON-LD schema detected on the crawled page.",
      missing.length ? `Missing high-value schema: ${missing.join(", ")}.` : "No major schema gaps detected.",
    ],
  );
}

function analyzeContentClarity(
  $: ReturnType<typeof load>,
  bodyText: string,
) {
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const earlyCopy = bodyText.slice(0, 550).toLowerCase();

  let score = 0;
  score += h1Count === 1 ? 6 : h1Count > 1 ? 3 : 0;
  score += h2Count >= 3 ? 6 : h2Count >= 1 ? 3 : 0;
  score += h3Count >= 2 ? 4 : h3Count >= 1 ? 2 : 0;
  score += /(helps|platform|software|service|for teams|for companies|compare)/.test(
    earlyCopy,
  )
    ? 4
    : 1;

  const diagnosis =
    score >= 15
      ? "The page uses a readable heading hierarchy and states the value proposition early enough for model extraction."
      : "The page needs clearer semantic hierarchy and sharper opening copy so AI systems can extract what you do and who you serve.";

  return buildDimension("content-clarity", "Content Clarity", score, diagnosis, [
    `Heading count: ${h1Count} H1 / ${h2Count} H2 / ${h3Count} H3.`,
    earlyCopy.length
      ? "Opening copy was analyzed for an explicit value proposition."
      : "Very little crawlable body copy was available.",
  ]);
}

function analyzePricingTransparency(
  bodyText: string,
) {
  const lowerBody = bodyText.toLowerCase();
  const hasCurrency = /\$\s?\d|\bpricing\b|\bplans\b|\bper month\b/.test(lowerBody);
  const hasComparison = /\bcompare\b|\bvs\b|\bstarter\b|\bgrowth\b|\benterprise\b/.test(
    lowerBody,
  );
  const hasCTA = /\bbook demo\b|\btalk to sales\b|\bcontact sales\b/.test(lowerBody);

  let score = 0;
  score += hasCurrency ? 10 : 2;
  score += hasComparison ? 6 : 2;
  score += hasCTA ? 4 : 2;

  const diagnosis =
    score >= 14
      ? "Pricing signals are discoverable. AI agents have enough information to cite cost or buying path."
      : "Pricing is opaque or incomplete. AI agents tend to avoid citing vendors when cost and packaging are unclear.";

  return buildDimension(
    "pricing-transparency",
    "Pricing Transparency",
    score,
    diagnosis,
    [
      hasCurrency
        ? "Pricing language or currency markers were detected."
        : "No explicit price or plan language was detected on the page.",
      hasComparison
        ? "Plan or package structure appears on-page."
        : "No clear package breakdown or plan comparison was detected.",
    ],
  );
}

function analyzeFaqCoverage($: ReturnType<typeof load>, html: string) {
  const headings = $("h2, h3, summary")
    .toArray()
    .map((entry) => $(entry).text().trim());
  const questionLikeHeadings = headings.filter(
    (heading) => heading.includes("?") || /^(what|how|why|when|can|do)\b/i.test(heading),
  );
  const faqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html);

  let score = 0;
  score += faqSchema ? 8 : 0;
  score += clamp(questionLikeHeadings.length, 0, 12);

  const diagnosis =
    score >= 14
      ? "The site already exposes enough buyer questions for AI agents to quote or summarize reliably."
      : "FAQ coverage is thin. AI agents need direct question-answer pairs for transactional and comparison queries.";

  return buildDimension("faq-coverage", "FAQ Coverage", score, diagnosis, [
    faqSchema
      ? "FAQPage schema detected."
      : "FAQPage schema was not detected on the crawled page.",
    `Question-like headings found: ${questionLikeHeadings.length}.`,
  ]);
}

function analyzeTrustSignals(bodyText: string) {
  const lowerBody = bodyText.toLowerCase();
  const trustMarkers = [
    /\btrusted by\b/,
    /\bcustomer stories\b|\bcase study\b|\btestimonials\b/,
    /\bsoc ?2\b|\biso ?27001\b|\bgdpr\b/,
    /\bfounded in\b|\bestablished\b/,
    /\bceo\b|\bfounder\b|\bleadership\b/,
    /\b\d{2,}\+ customers\b|\b\d{2,}\+ teams\b|\b\d{2,}\+ companies\b/,
  ];

  const matched = trustMarkers.filter((pattern) => pattern.test(lowerBody)).length;
  const score = clamp(matched * 2, 0, 10);
  const diagnosis =
    score >= 6
      ? "The page includes enough concrete proof points to make citations feel defensible."
      : "Trust signals are too light. Add named proof, quantified claims, reviews, and leadership credibility.";

  return buildDimension("trust-signals", "Trust Signals", score, diagnosis, [
    `Trust-signal patterns matched: ${matched}.`,
    matched
      ? "Review, compliance, customer-count, or leadership language was detected."
      : "Little concrete proof language was detected on the crawled page.",
  ]);
}

function analyzeCitationReadiness(bodyText: string) {
  const lowerBody = bodyText.toLowerCase();
  const markers = [
    /\bas seen in\b|\bfeatured in\b|\bmentioned by\b/,
    /\bcompare\b|\balternative to\b|\bversus\b/,
    /\bpricing\b/,
    /\bfaq\b|\bfrequently asked questions\b/,
    /\bcase study\b|\bproof\b/,
  ];

  const matched = markers.filter((pattern) => pattern.test(lowerBody)).length;
  const score = clamp(matched, 0, 5);
  const diagnosis =
    score >= 3
      ? "The site has enough structured buying and proof content to compete for AI citations."
      : "The site lacks the explicit comparison, proof, and question-answer assets that commonly feed AI citations.";

  return buildDimension(
    "citation-readiness",
    "Citation Readiness",
    score,
    diagnosis,
    [
      `Citation-readiness patterns matched: ${matched}.`,
      "This heuristic substitutes for a full off-site citation baseline in the MVP.",
    ],
  );
}

function buildRecommendations(
  dimensions: ScoreDimension[],
  overallScore: number,
): Recommendation[] {
  const templates: Record<
    ScoreDimensionKey,
    Omit<Recommendation, "id" | "locked">
  > = {
    "structured-data": {
      title: "Ship a schema pack on core money pages",
      detail:
        "Add Organization, Product, FAQPage, BreadcrumbList, and review schema to the homepage, pricing page, and top product pages so models stop guessing your entity context.",
      impact: "High",
      effort: "Medium",
    },
    "content-clarity": {
      title: "Rewrite page openings for extraction, not only persuasion",
      detail:
        "Make the first 100 words answer who you serve, what you do, and what makes you different. Then tighten heading hierarchy so LLMs can map the page without inference.",
      impact: "High",
      effort: "Low",
    },
    "pricing-transparency": {
      title: "Expose pricing or buying-path clarity on-page",
      detail:
        "If you cannot show full pricing, at least show package ranges, minimum contract values, and what is included. Hidden pricing suppresses citation confidence for transactional queries.",
      impact: "High",
      effort: "Medium",
    },
    "faq-coverage": {
      title: "Publish the 12 buyer questions AI agents keep looking for",
      detail:
        "Create a real FAQ block covering fit, implementation, integrations, security, pricing, migration, and competitor comparison. Pair it with FAQPage schema.",
      impact: "High",
      effort: "Low",
    },
    "trust-signals": {
      title: "Add named proof instead of generic credibility copy",
      detail:
        "Put customer counts, review quotes, certifications, leadership names, and dated case studies directly on the page. Specificity increases model trust far more than slogans.",
      impact: "Medium",
      effort: "Low",
    },
    "citation-readiness": {
      title: "Build pages that can win recommendation queries",
      detail:
        "Launch comparison pages, category pages, and evidence-backed use-case pages for your most valuable buying queries. These assets directly expand citation surface area.",
      impact: "High",
      effort: "High",
    },
  };

  const ranked = [...dimensions].sort((left, right) => left.score - right.score);

  const recommendations = ranked.map((dimension, index) => ({
    id: `${dimension.key}-${index + 1}`,
    locked: index >= 3,
    ...templates[dimension.key],
  }));

  if (overallScore < 45) {
    recommendations.push({
      id: "launch-money-page",
      locked: true,
      title: "Create a dedicated AEO-ready pricing or solution page",
      detail:
        "Right now the site is forcing AI systems to synthesize from weak signals. A single high-intent solution page with proof, pricing language, FAQs, and schema can move citations quickly.",
      impact: "High",
      effort: "High",
    });
  }

  recommendations.push({
    id: "competitor-gap",
    locked: true,
    title: "Run a 25-query competitor citation baseline",
    detail:
      "Measure where competitors are being cited instead of you, then prioritize fixes by expected citation-share lift rather than generic SEO best practices.",
    impact: "High",
    effort: "Medium",
  });

  recommendations.push({
    id: "retainer-pilot",
    locked: true,
    title: "Turn the fixes into a 90-day implementation sprint",
    detail:
      "Bundle schema, FAQ, proof, pricing, and content improvements into a weekly operating plan. The service business is where AEOSpark captures outcome value, not another dashboard.",
    impact: "Medium",
    effort: "Medium",
  });

  return recommendations.slice(0, 10);
}

async function analyzeSingleUrl(input: string) {
  const page = await fetchWebsiteHtml(input);
  const $ = load(page.html);
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const companyName = detectCompanyName($, page.url);

  const dimensions = [
    analyzeStructuredData(page.html),
    analyzeContentClarity($, bodyText),
    analyzePricingTransparency(bodyText),
    analyzeFaqCoverage($, page.html),
    analyzeTrustSignals(bodyText),
    analyzeCitationReadiness(bodyText),
  ];

  const overallScore = dimensions.reduce(
    (total, dimension) => total + dimension.score,
    0,
  );

  return {
    url: page.url,
    companyName,
    overallScore,
    verdict: summarizeVerdict(overallScore),
    crawlStatus: page.crawlStatus,
    crawlNotes: page.crawlNotes,
    dimensions,
  };
}

function buildComparison(
  primary: Awaited<ReturnType<typeof analyzeSingleUrl>>,
  competitor: Awaited<ReturnType<typeof analyzeSingleUrl>>,
): ComparisonScore {
  return {
    url: competitor.url,
    companyName: competitor.companyName,
    overallScore: competitor.overallScore,
    verdict: competitor.verdict,
    dimensions: competitor.dimensions,
    gapVsPrimary: competitor.overallScore - primary.overallScore,
  };
}

export async function createScorecard(inputUrl: string, competitorUrl?: string) {
  const [primary, competitor] = await Promise.all([
    analyzeSingleUrl(inputUrl),
    competitorUrl ? analyzeSingleUrl(competitorUrl) : Promise.resolve(undefined),
  ]);

  const score: ScoreRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    url: primary.url,
    companyName: primary.companyName,
    overallScore: primary.overallScore,
    verdict: primary.verdict,
    executiveSummary:
      primary.overallScore < 50
        ? `${primary.companyName} is likely losing recommendation queries because the site is underspecified for AI extraction.`
        : `${primary.companyName} has a workable AEO foundation, but its visibility upside depends on tightening the weakest dimensions first.`,
    crawlStatus: primary.crawlStatus,
    crawlNotes: primary.crawlNotes,
    dimensions: primary.dimensions,
    recommendations: buildRecommendations(primary.dimensions, primary.overallScore),
    comparison:
      competitor && competitor.url !== primary.url
        ? buildComparison(primary, competitor)
        : undefined,
  };

  return score;
}
