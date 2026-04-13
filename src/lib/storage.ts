import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import type {
  AuditRecord,
  CitationQueryResult,
  CitationRunRecord,
  ClientRecord,
  LeadRecord,
  OrderRecord,
  ProviderCredential,
  Recommendation,
  ScoreDimension,
  ScoreRecord,
} from "@/lib/types";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Prisma storage.");
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function domainFromUrl(url: string) {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function titleFromDomain(domain: string) {
  return domain
    .split(".")[0]
    ?.split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readJson<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }
  return value as T;
}

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function scoreDimensionValue(
  score: Partial<ScoreRecord> & { dimensions?: ScoreDimension[] },
  key: ScoreDimension["key"],
) {
  return score.dimensions?.find((dimension) => dimension.key === key)?.score ?? null;
}

function scoreToDb(score: ScoreRecord) {
  return {
    id: score.id,
    url: score.url,
    domain: domainFromUrl(score.url),
    scoreTotal: score.overallScore,
    scoreCrawlerAccess: scoreDimensionValue(score, "crawler-access"),
    scoreStructuredData: scoreDimensionValue(score, "structured-data"),
    scoreContentArch: scoreDimensionValue(score, "content-architecture"),
    scorePricing: scoreDimensionValue(score, "pricing-visibility"),
    scoreAuthority: scoreDimensionValue(score, "authority-signals"),
    scoreBingPresence: scoreDimensionValue(score, "bing-presence"),
    scoreBrandFootprint: scoreDimensionValue(score, "brand-footprint"),
    scoreDetails: {
      publicSlug: score.publicSlug,
      appRecord: score,
    },
    crawlStatus: score.crawlStatus === "live" ? "success" : "partial",
    jobStatus: "complete",
    jobStep: null,
    createdAt: new Date(score.createdAt),
  };
}

function scoreFromDb(row: {
  id: string;
  url: string;
  domain: string;
  scoreTotal: number | null;
  scoreDetails: unknown;
  crawlStatus: string | null;
  createdAt: Date;
}) {
  const scoreDetails = readJson<{ appRecord?: ScoreRecord; publicSlug?: string }>(
    row.scoreDetails,
    {},
  );

  if (scoreDetails.appRecord) {
    return {
      ...scoreDetails.appRecord,
      id: row.id,
      url: row.url,
      createdAt: row.createdAt.toISOString(),
      overallScore: row.scoreTotal ?? scoreDetails.appRecord.overallScore,
      publicSlug:
        scoreDetails.publicSlug ??
        scoreDetails.appRecord.publicSlug ??
        domainFromUrl(row.url),
      crawlStatus:
        row.crawlStatus === "success"
          ? "live"
          : (scoreDetails.appRecord.crawlStatus ?? "fallback"),
    } satisfies ScoreRecord;
  }

  const dimensions = readArray<ScoreDimension>(
    readJson<{ dimensions?: ScoreDimension[] }>(row.scoreDetails, {}).dimensions,
  );
  const recommendations = readArray<Recommendation>(
    readJson<{ recommendations?: Recommendation[] }>(row.scoreDetails, {})
      .recommendations,
  );

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    publicSlug: scoreDetails.publicSlug ?? domainFromUrl(row.url),
    url: row.url,
    companyName: titleFromDomain(row.domain),
    overallScore: row.scoreTotal ?? 0,
    verdict: "Stored score record",
    executiveSummary: "Score details were loaded from Postgres.",
    crawlStatus: row.crawlStatus === "success" ? "live" : "fallback",
    crawlNotes: [],
    teaserPdfReady: true,
    calendlyUrl: "https://calendly.com",
    dimensions,
    recommendations,
  } satisfies ScoreRecord;
}

function leadFromDb(
  row: {
    id: string;
    name: string | null;
    email: string;
    url: string | null;
    scoreId: string | null;
    source: string | null;
    createdAt: Date;
  },
  fallback?: Partial<LeadRecord>,
) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    name: row.name ?? fallback?.name ?? "",
    email: row.email,
    website: row.url ?? fallback?.website ?? "",
    scoreId: row.scoreId ?? fallback?.scoreId ?? "",
    score: fallback?.score ?? 0,
    source: row.source ?? fallback?.source ?? "score_gate",
  } satisfies LeadRecord;
}

function clientToDb(client: ClientRecord) {
  const apiKeyStatus = client.apiKeyStatus ?? [];
  const anthropic = apiKeyStatus.find((item) => item.provider === "Anthropic");
  const openAi = apiKeyStatus.find((item) => item.provider === "OpenAI");

  return {
    id: client.id,
    email: client.email,
    domain: domainFromUrl(client.website),
    plan: client.plan,
    stripeSubscriptionId: null,
    anthropicKeyEncrypted: anthropic?.encryptedKey ?? null,
    openaiKeyEncrypted: openAi?.encryptedKey ?? null,
    queryLibrary: {
      companyName: client.companyName,
      website: client.website,
      dashboardHeadline: client.dashboardHeadline,
      baselineCitationShare: client.baselineCitationShare,
      currentCitationShare: client.currentCitationShare,
      citationGap: client.citationGap,
      trackedQueries: client.trackedQueries,
      priorities: client.priorities,
      monthlyDeliverables: client.monthlyDeliverables,
      apiKeyStatus: client.apiKeyStatus,
      trend: client.trend,
    },
    competitors: {
      trackedCompetitors: client.trackedCompetitors,
    },
    active: true,
    createdAt: new Date(client.createdAt),
  };
}

function clientFromDb(row: {
  id: string;
  email: string;
  domain: string;
  plan: string | null;
  anthropicKeyEncrypted: string | null;
  openaiKeyEncrypted: string | null;
  queryLibrary: unknown;
  competitors: unknown;
  createdAt: Date;
}) {
  const queryLibrary = readJson<{
    companyName?: string;
    website?: string;
    dashboardHeadline?: string;
    baselineCitationShare?: number;
    currentCitationShare?: number;
    citationGap?: number;
    trackedQueries?: number;
    priorities?: string[];
    monthlyDeliverables?: string[];
    apiKeyStatus?: ProviderCredential[];
    trend?: ClientRecord["trend"];
  }>(row.queryLibrary, {});
  const competitors = readJson<{ trackedCompetitors?: string[] }>(
    row.competitors,
    {},
  );

  const apiKeyStatus =
    queryLibrary.apiKeyStatus ??
    ([
      {
        provider: "Anthropic",
        connected: Boolean(row.anthropicKeyEncrypted),
        encryptedKey: row.anthropicKeyEncrypted ?? undefined,
      },
      {
        provider: "OpenAI",
        connected: Boolean(row.openaiKeyEncrypted),
        encryptedKey: row.openaiKeyEncrypted ?? undefined,
      },
      {
        provider: "Gemini",
        connected: false,
      },
    ] satisfies ProviderCredential[]);

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    companyName: queryLibrary.companyName ?? titleFromDomain(row.domain),
    email: row.email,
    website: queryLibrary.website ?? `https://${row.domain}`,
    plan: (row.plan as ClientRecord["plan"]) ?? "Audit",
    dashboardHeadline:
      queryLibrary.dashboardHeadline ??
      "Track citation share, competitor gap, and implementation progress.",
    baselineCitationShare: queryLibrary.baselineCitationShare ?? 0,
    currentCitationShare: queryLibrary.currentCitationShare ?? 0,
    citationGap: queryLibrary.citationGap ?? 0,
    trackedQueries: queryLibrary.trackedQueries ?? 0,
    trackedCompetitors: competitors.trackedCompetitors ?? [],
    priorities: queryLibrary.priorities ?? [],
    monthlyDeliverables: queryLibrary.monthlyDeliverables ?? [],
    apiKeyStatus,
    trend: queryLibrary.trend ?? [],
  } satisfies ClientRecord;
}

function auditToDb(audit: AuditRecord) {
  const claudeQueries = audit.queryResults.filter(
    (result) => result.provider === "Anthropic",
  );
  const chatgptQueries = audit.queryResults.filter(
    (result) => result.provider === "OpenAI",
  );

  return {
    id: audit.id,
    orderId: audit.orderId,
    domain: domainFromUrl(audit.website),
    chatgptQueries,
    claudeQueries,
    citationSharePct: audit.citationBaselinePct,
    competitor1Domain: null,
    competitor1SharePct: audit.competitorCitationPct,
    competitor2Domain: null,
    competitor2SharePct: null,
    bingIndexed: null,
    bingPageCount: null,
    braveIndexed: null,
    redditMentions: null,
    g2Listed: null,
    capterraListed: null,
    trustpilotListed: null,
    pagesAudited: audit.pagesAnalyzed.length,
    citationReadyPages: null,
    fullReportJson: {
      appRecord: audit,
    },
    createdAt: new Date(audit.createdAt),
  };
}

function auditFromDb(row: {
  id: string;
  orderId: string | null;
  domain: string;
  citationSharePct: PrismaNullableNumber;
  competitor1SharePct: PrismaNullableNumber;
  fullReportJson: unknown;
  createdAt: Date;
}) {
  const fullReport = readJson<{ appRecord?: AuditRecord }>(row.fullReportJson, {});
  if (fullReport.appRecord) {
    return {
      ...fullReport.appRecord,
      id: row.id,
      orderId: row.orderId ?? fullReport.appRecord.orderId,
      createdAt: row.createdAt.toISOString(),
    } satisfies AuditRecord;
  }

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    orderId: row.orderId ?? "",
    scoreId: "",
    clientId: "",
    companyName: titleFromDomain(row.domain),
    website: `https://${row.domain}`,
    executiveSummary: "Audit record loaded from Postgres.",
    citationBaselinePct: numberOrZero(row.citationSharePct),
    competitorCitationPct: numberOrZero(row.competitor1SharePct),
    pagesAnalyzed: [],
    queryResults: [],
    topFixes: [],
    roadmap: [],
  } satisfies AuditRecord;
}

type PrismaNullableNumber =
  | number
  | { toNumber(): number }
  | null
  | undefined;

function numberOrZero(value: PrismaNullableNumber) {
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return 0;
}

function orderStatusForUi(status: string | null): OrderRecord["status"] {
  if (
    status === "failed" ||
    status === "requires_action" ||
    status === "processing" ||
    status === "delivered" ||
    status === "refunded"
  ) {
    return status;
  }
  return "pending";
}

function normalizeOrderStatus(status: OrderRecord["status"]) {
  switch (status) {
    case "failed":
      return "failed";
    case "requires_action":
      return "requires_action";
    case "processing":
      return "processing";
    case "delivered":
      return "delivered";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
}

async function loadAuditIdForOrder(orderId: string) {
  const audit = await getAuditByOrderId(orderId);
  return audit?.id;
}

async function loadClientIdForOrder(row: { email: string; url: string }) {
  const client = await findClientByEmailAndDomain(row.email, domainFromUrl(row.url));
  return client?.id;
}

function orderFromDb(
  row: {
    id: string;
    createdAt: Date;
    name: string | null;
    email: string;
    url: string;
    amountCents: number | null;
    status: string | null;
    stripePaymentIntentId: string;
  },
  extras?: {
    clientId?: string;
    auditId?: string;
    companyName?: string;
    scoreId?: string;
  },
) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    name: row.name ?? "",
    email: row.email,
    companyName: extras?.companyName ?? titleFromDomain(domainFromUrl(row.url)),
    website: row.url,
    amount: Math.round((row.amountCents ?? 0) / 100),
    plan: "Audit",
    status: orderStatusForUi(row.status),
    scoreId: extras?.scoreId,
    clientId: extras?.clientId,
    auditId: extras?.auditId,
    stripePaymentIntentId: row.stripePaymentIntentId,
  } satisfies OrderRecord;
}

function parseCitationMeta(rawResponse: string | null) {
  if (!rawResponse) {
    return {};
  }

  try {
    return JSON.parse(rawResponse) as {
      runId?: string;
      createdAt?: string;
      queryCount?: number;
      clientCitationShare?: number;
      competitorCitationShare?: number;
      alertTriggered?: boolean;
      snippet?: string;
    };
  } catch {
    return {};
  }
}

function platformLabel(platform: string | null) {
  switch ((platform ?? "").toLowerCase()) {
    case "claude":
    case "anthropic":
      return "Anthropic";
    case "chatgpt":
    case "openai":
      return "OpenAI";
    default:
      return "Gemini";
  }
}

function citationQueryFromDb(row: {
  id: string;
  query: string;
  platform: string | null;
  cited: boolean | null;
  competitorCited: string | null;
  sentiment: string | null;
  rawResponse: string | null;
}) {
  const meta = parseCitationMeta(row.rawResponse);
  return {
    id: row.id,
    provider: platformLabel(row.platform),
    query: row.query,
    cited: Boolean(row.cited),
    citedBrand: row.competitorCited ?? undefined,
    sentiment:
      row.sentiment === "positive" || row.sentiment === "negative"
        ? row.sentiment
        : "neutral",
    snippet: meta.snippet ?? row.rawResponse ?? "",
  } satisfies CitationQueryResult;
}

export async function createScore(data: ScoreRecord) {
  return prisma.score.create({ data: scoreToDb(data) });
}

export async function findRecentScoreByDomain(domain: string, hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.score.findFirst({
    where: {
      domain,
      createdAt: { gte: cutoff },
      jobStatus: "complete",
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPendingScoreJob(input: { domain: string; url: string }) {
  return prisma.score.create({
    data: {
      domain: input.domain,
      url: input.url,
      crawlStatus: "pending",
      jobStatus: "pending",
      jobStep: "Fetching your website...",
    },
  });
}

export async function getScoreRowById(id: string) {
  return prisma.score.findUnique({ where: { id } });
}

export async function updateScoreJob(
  id: string,
  data: {
    scoreTotal?: number;
    scoreCrawlerAccess?: number;
    scoreStructuredData?: number;
    scoreContentArch?: number;
    scorePricing?: number;
    scoreAuthority?: number;
    scoreBingPresence?: number;
    scoreBrandFootprint?: number;
    scoreDetails?: unknown;
    crawlStatus?: string;
    jobStatus?: string;
    jobStep?: string | null;
    createdAt?: Date;
    url?: string;
    domain?: string;
  },
) {
  return prisma.score.update({
    where: { id },
    data: {
      ...data,
      scoreDetails: data.scoreDetails as object | undefined,
    },
  });
}

export async function getScore(id: string) {
  return prisma.score.findUnique({ where: { id } });
}

export async function updateScore(id: string, data: Partial<ScoreRecord>) {
  const current = await getScoreById(id);
  if (!current) {
    return null;
  }

  return prisma.score.update({
    where: { id },
    data: scoreToDb({ ...current, ...data }),
  });
}

export async function createLead(data: {
  email: string;
  name?: string;
  url: string;
  scoreId?: string;
  source?: string;
}) {
  return prisma.lead.create({
    data: {
      name: data.name ?? null,
      email: data.email,
      url: data.url,
      scoreId: data.scoreId ?? null,
      source: data.source ?? "score_gate",
    },
  });
}

export async function createOrder(data: {
  email: string;
  name?: string;
  url: string;
  stripePaymentIntentId: string;
  amountCents?: number;
  status?: string;
}) {
  return prisma.order.create({
    data: {
      email: data.email,
      name: data.name ?? null,
      url: data.url,
      stripePaymentIntentId: data.stripePaymentIntentId,
      amountCents: data.amountCents ?? 99_700,
      status: data.status ?? "pending",
    },
  });
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({ where: { id } });
}

export async function getOrderByStripePaymentIntent(paymentIntentId: string) {
  return prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
  });
}

export async function updateOrder(id: string, data: Partial<OrderRecord>) {
  const updated = await prisma.order.update({
    where: { id },
    data: {
      email: data.email,
      name: data.name,
      url: data.website,
      stripePaymentIntentId: data.stripePaymentIntentId,
      amountCents: data.amount !== undefined ? Math.round(data.amount * 100) : undefined,
      status: data.status !== undefined ? normalizeOrderStatus(data.status) : undefined,
    },
  });

  const [auditId, clientId] = await Promise.all([
    loadAuditIdForOrder(id),
    loadClientIdForOrder(updated),
  ]);

  return orderFromDb(updated, { auditId, clientId });
}

export async function updateOrderDelivery(
  id: string,
  data: { reportUrl?: string; status?: OrderRecord["status"]; deliveredAt?: Date },
) {
  const updated = await prisma.order.update({
    where: { id },
    data: {
      reportUrl: data.reportUrl,
      status: data.status ? normalizeOrderStatus(data.status) : undefined,
      deliveredAt: data.deliveredAt,
    },
  });

  const [auditId, clientId] = await Promise.all([
    loadAuditIdForOrder(id),
    loadClientIdForOrder(updated),
  ]);

  return orderFromDb(updated, { auditId, clientId });
}

export async function createAudit(data: AuditRecord) {
  return prisma.auditResult.create({ data: auditToDb(data) });
}

export async function updateAudit(id: string, data: Partial<AuditRecord>) {
  const current = await getAuditById(id);
  if (!current) {
    return null;
  }

  return prisma.auditResult.update({
    where: { id },
    data: auditToDb({ ...current, ...data }),
  });
}

export async function storeScore(score: ScoreRecord) {
  await createScore(score);
  return score;
}

export async function listScores(limit = 20) {
  const rows = await prisma.score.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(scoreFromDb);
}

export async function getScoreById(scoreId: string) {
  const row = await getScore(scoreId);
  return row ? scoreFromDb(row) : undefined;
}

export async function getScoreBySlug(publicSlug: string) {
  const rows = await prisma.score.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(scoreFromDb).find((score) => score.publicSlug === publicSlug);
}

export async function captureLead(input: {
  email: string;
  name: string;
  score: number;
  scoreId: string;
  website: string;
}) {
  const row = await createLead({
    email: input.email,
    name: input.name,
    url: input.website,
    scoreId: input.scoreId || undefined,
    source: "score_gate",
  });
  return leadFromDb(row, {
    name: input.name,
    score: input.score,
    website: input.website,
    scoreId: input.scoreId,
    source: "score_gate",
  });
}

export async function createClient(client: ClientRecord) {
  return prisma.client.create({ data: clientToDb(client) });
}

async function findClientByEmailAndDomain(email: string, domain: string) {
  const row = await prisma.client.findFirst({
    where: { email, domain },
  });
  return row ? clientFromDb(row) : undefined;
}

export async function createAuditOrder(input: {
  companyName: string;
  email: string;
  name: string;
  scoreId?: string;
  status: OrderRecord["status"];
  website: string;
  stripePaymentIntentId?: string;
}) {
  const score = input.scoreId ? await getScoreById(input.scoreId) : undefined;

  let clientId: string | undefined;
  if (input.status !== "failed" && input.status !== "requires_action") {
    const createdAt = new Date().toISOString();
    const fallbackClient: ClientRecord = {
      id: crypto.randomUUID(),
      createdAt,
      companyName: input.companyName || titleFromDomain(domainFromUrl(input.website)),
      email: input.email,
      website: input.website,
      plan: "Audit",
      dashboardHeadline:
        "Track citation share, competitor gap, and implementation progress.",
      baselineCitationShare: Math.max(4, Math.round((score?.overallScore ?? 28) / 3)),
      currentCitationShare: Math.max(8, Math.round((score?.overallScore ?? 28) / 2.5)),
      citationGap: 12,
      trackedQueries: 25,
      trackedCompetitors: [],
      priorities: [],
      monthlyDeliverables: [],
      apiKeyStatus: [
        { provider: "Anthropic", connected: false },
        { provider: "OpenAI", connected: false },
        { provider: "Gemini", connected: false },
      ],
      trend: [],
    };
    const clientRow = await createClient(fallbackClient);
    clientId = clientRow.id;
  }

  const orderRow = await createOrder({
    email: input.email,
    name: input.name,
    url: input.website,
    stripePaymentIntentId:
      input.stripePaymentIntentId ?? `pi_local_${crypto.randomUUID()}`,
    amountCents: 250_000,
    status: normalizeOrderStatus(input.status),
  });

  return orderFromDb(orderRow, {
    clientId,
    companyName: input.companyName || titleFromDomain(domainFromUrl(input.website)),
    scoreId: input.scoreId,
  });
}

export async function attachAuditToOrder(orderId: string, auditId: string) {
  void orderId;
  void auditId;
  return true;
}

export async function getOrderById(orderId: string) {
  const row = await getOrder(orderId);
  if (!row) {
    return undefined;
  }

  const [auditId, clientId] = await Promise.all([
    loadAuditIdForOrder(orderId),
    loadClientIdForOrder(row),
  ]);

  return orderFromDb(row, { auditId, clientId });
}

export async function getOrderByReference(orderReference: string) {
  if (isUuid(orderReference)) {
    const byId = await getOrderById(orderReference);
    if (byId) {
      return byId;
    }
  }

  const byPaymentIntent = await getOrderByStripePaymentIntent(orderReference);
  if (!byPaymentIntent) {
    return undefined;
  }

  const [auditId, clientId] = await Promise.all([
    loadAuditIdForOrder(byPaymentIntent.id),
    loadClientIdForOrder(byPaymentIntent),
  ]);

  return orderFromDb(byPaymentIntent, { auditId, clientId });
}

export async function findExistingAuditOrder(email: string, website: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const targetDomain = domainFromUrl(website);

  const rows = await prisma.order.findMany({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
      status: {
        in: ["pending", "processing", "delivered", "requires_action"],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const match = rows.find((row) => {
    try {
      return domainFromUrl(row.url) === targetDomain;
    } catch {
      return false;
    }
  });

  if (!match) {
    return undefined;
  }

  const [auditId, clientId] = await Promise.all([
    loadAuditIdForOrder(match.id),
    loadClientIdForOrder(match),
  ]);

  return orderFromDb(match, { auditId, clientId });
}

export async function getClientById(clientId: string) {
  const row = await prisma.client.findUnique({ where: { id: clientId } });
  return row ? clientFromDb(row) : undefined;
}

export async function getClientBySubscriptionId(subscriptionId: string) {
  const row = await prisma.client.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  return row ? clientFromDb(row) : undefined;
}

export async function updateClient(clientId: string, partial: Partial<ClientRecord>) {
  const current = await getClientById(clientId);
  if (!current) {
    return undefined;
  }

  const next = { ...current, ...partial };
  const updated = await prisma.client.update({
    where: { id: clientId },
    data: clientToDb(next),
  });
  return clientFromDb(updated);
}

export async function setClientActiveBySubscriptionId(
  subscriptionId: string,
  active: boolean,
) {
  const client = await prisma.client.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!client) {
    return undefined;
  }

  const updated = await prisma.client.update({
    where: { id: client.id },
    data: { active },
  });

  return clientFromDb(updated);
}

export async function markLeadEmailSent(leadId: string, field: "pdfSent" | "followupSent") {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      [field]: true,
    },
  });
}

export async function upsertClientCredential(
  clientId: string,
  provider: ProviderCredential["provider"],
  partial: Omit<ProviderCredential, "provider">,
) {
  const client = await getClientById(clientId);
  if (!client) {
    return undefined;
  }

  const currentStatuses = client.apiKeyStatus.length
    ? client.apiKeyStatus
    : ([
        { provider: "Anthropic", connected: false },
        { provider: "OpenAI", connected: false },
        { provider: "Gemini", connected: false },
      ] satisfies ProviderCredential[]);

  const nextStatuses = currentStatuses.map((item) =>
    item.provider === provider ? { ...item, ...partial, provider } : item,
  );

  return updateClient(clientId, { apiKeyStatus: nextStatuses });
}

export async function storeAudit(audit: AuditRecord) {
  await createAudit(audit);
  return audit;
}

export async function getAuditById(auditId: string) {
  const row = await prisma.auditResult.findUnique({ where: { id: auditId } });
  return row ? auditFromDb(row) : undefined;
}

export async function getAuditByOrderId(orderId: string) {
  const row = await prisma.auditResult.findFirst({ where: { orderId } });
  return row ? auditFromDb(row) : undefined;
}

export async function storeCitationRun(run: CitationRunRecord) {
  if (!run.queryResults.length) {
    return run;
  }

  await prisma.citationResult.createMany({
    data: run.queryResults.map((result) => ({
      clientId: run.clientId,
      query: result.query,
      platform: result.provider.toLowerCase(),
      cited: result.cited,
      competitorCited: result.citedBrand ?? null,
      sentiment: result.sentiment,
      rawResponse: JSON.stringify({
        runId: run.id,
        createdAt: run.createdAt,
        queryCount: run.queryCount,
        clientCitationShare: run.clientCitationShare,
        competitorCitationShare: run.competitorCitationShare,
        alertTriggered: run.alertTriggered,
        snippet: result.snippet,
      }),
      createdAt: new Date(run.createdAt),
    })),
  });

  return run;
}

export async function listCitationRunsForClient(clientId: string, limit = 10) {
  const rows = await prisma.citationResult.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const grouped = new Map<string, CitationRunRecord>();

  for (const row of rows) {
    const meta = parseCitationMeta(row.rawResponse);
    const runId = meta.runId ?? `${row.createdAt.toISOString()}-${row.clientId}`;
    const existing = grouped.get(runId);
    const queryResult = citationQueryFromDb(row);

    if (existing) {
      existing.queryResults.push(queryResult);
      continue;
    }

    grouped.set(runId, {
      id: runId,
      createdAt: meta.createdAt ?? row.createdAt.toISOString(),
      clientId,
      queryCount: meta.queryCount ?? 0,
      clientCitationShare: meta.clientCitationShare ?? 0,
      competitorCitationShare: meta.competitorCitationShare ?? 0,
      alertTriggered: Boolean(meta.alertTriggered),
      queryResults: [queryResult],
    });
  }

  return [...grouped.values()]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}
