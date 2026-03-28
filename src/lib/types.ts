export type ScoreDimensionKey =
  | "crawler-access"
  | "structured-data"
  | "content-architecture"
  | "pricing-visibility"
  | "authority-signals"
  | "bing-presence"
  | "brand-footprint"
  | "content-clarity"
  | "pricing-transparency"
  | "faq-coverage"
  | "trust-signals"
  | "citation-readiness";

export type ScoreDimension = {
  key: ScoreDimensionKey;
  label: string;
  weight: number;
  score: number;
  diagnosis: string;
  evidence: string[];
};

export type Recommendation = {
  id: string;
  title: string;
  detail: string;
  impact: "High" | "Medium";
  effort: "Low" | "Medium" | "High";
  locked: boolean;
};

export type ComparisonScore = {
  url: string;
  companyName: string;
  overallScore: number;
  verdict: string;
  dimensions: ScoreDimension[];
  gapVsPrimary: number;
};

export type ScoreRecord = {
  id: string;
  createdAt: string;
  publicSlug: string;
  url: string;
  companyName: string;
  overallScore: number;
  verdict: string;
  executiveSummary: string;
  crawlStatus: "live" | "fallback" | "partial" | "blocked";
  crawlNotes: string[];
  teaserPdfReady: boolean;
  calendlyUrl: string;
  dimensions: ScoreDimension[];
  recommendations: Recommendation[];
  comparison?: ComparisonScore;
};

export type LeadRecord = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  website: string;
  scoreId: string;
  score: number;
  source: string;
};

export type JobRecord = {
  id: string;
  createdAt: string;
  name: string;
  status: "queued" | "completed" | "failed";
  payload: Record<string, unknown>;
};

export type TrendPoint = {
  label: string;
  citationShare: number;
  competitorShare: number;
};

export type ProviderName = "Anthropic" | "OpenAI" | "Gemini";

export type ProviderCredential = {
  provider: ProviderName;
  connected: boolean;
  lastUpdatedAt?: string;
  encryptedKey?: string;
};

export type ClientRecord = {
  id: string;
  createdAt: string;
  companyName: string;
  email: string;
  website: string;
  plan: "Audit" | "Starter" | "Growth" | "Scale";
  dashboardHeadline: string;
  baselineCitationShare: number;
  currentCitationShare: number;
  citationGap: number;
  trackedQueries: number;
  trackedCompetitors: string[];
  priorities: string[];
  monthlyDeliverables: string[];
  apiKeyStatus: ProviderCredential[];
  trend: TrendPoint[];
};

export type OrderRecord = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  companyName: string;
  website: string;
  amount: number;
  plan: "Audit";
  status:
    | "pending"
    | "processing"
    | "delivered"
    | "refunded"
    | "failed"
    | "requires_action";
  scoreId?: string;
  clientId?: string;
  auditId?: string;
  stripePaymentIntentId?: string;
};

export type CitationQueryResult = {
  id: string;
  provider: ProviderName;
  query: string;
  cited: boolean;
  citedBrand?: string;
  sentiment: "positive" | "neutral" | "negative";
  snippet: string;
};

export type AuditFix = {
  id: string;
  title: string;
  whyItMatters: string;
  effort: "Low" | "Medium" | "High";
  expectedImpact: "High" | "Medium";
  steps: string[];
};

export type RoadmapPhase = {
  title: string;
  detail: string;
};

export type AuditRecord = {
  id: string;
  createdAt: string;
  orderId: string;
  scoreId: string;
  clientId: string;
  companyName: string;
  website: string;
  executiveSummary: string;
  citationBaselinePct: number;
  competitorCitationPct: number;
  pagesAnalyzed: string[];
  queryResults: CitationQueryResult[];
  topFixes: AuditFix[];
  roadmap: RoadmapPhase[];
  deliveredAt?: string;
};

export type CitationRunRecord = {
  id: string;
  createdAt: string;
  clientId: string;
  queryCount: number;
  clientCitationShare: number;
  competitorCitationShare: number;
  alertTriggered: boolean;
  queryResults: CitationQueryResult[];
};
