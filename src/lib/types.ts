export type ScoreDimensionKey =
  | "structured-data"
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
  url: string;
  companyName: string;
  overallScore: number;
  verdict: string;
  executiveSummary: string;
  crawlStatus: "live" | "fallback";
  crawlNotes: string[];
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
  status: "queued" | "completed";
  payload: Record<string, unknown>;
};

export type TrendPoint = {
  label: string;
  citationShare: number;
  competitorShare: number;
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
  apiKeyStatus: Array<{
    provider: "Anthropic" | "OpenAI" | "Gemini";
    connected: boolean;
  }>;
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
  status: "paid" | "failed";
  scoreId?: string;
  clientId?: string;
};
