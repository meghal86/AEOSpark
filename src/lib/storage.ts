import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  ClientRecord,
  JobRecord,
  LeadRecord,
  OrderRecord,
  ScoreRecord,
} from "@/lib/types";

type CollectionMap = {
  clients: ClientRecord[];
  jobs: JobRecord[];
  leads: LeadRecord[];
  orders: OrderRecord[];
  scores: ScoreRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readCollection<K extends keyof CollectionMap>(
  name: K,
): Promise<CollectionMap[K]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as CollectionMap[K];
  } catch {
    return [] as CollectionMap[K];
  }
}

async function writeCollection<K extends keyof CollectionMap>(
  name: K,
  records: CollectionMap[K],
) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${name}.json`);
  await writeFile(filePath, JSON.stringify(records, null, 2));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hostnameLabel(website: string) {
  return new URL(website).hostname.replace(/^www\./, "");
}

async function logJob(name: string, payload: Record<string, unknown>) {
  const jobs = await readCollection("jobs");
  jobs.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    status: "queued",
    payload,
  });
  await writeCollection("jobs", jobs);
}

function seededTrend(score: number) {
  const baseline = clamp(Math.max(4, Math.round(score / 3)), 4, 42);
  return [
    { label: "Day 0", citationShare: baseline, competitorShare: baseline + 14 },
    { label: "Day 15", citationShare: baseline + 4, competitorShare: baseline + 13 },
    { label: "Day 30", citationShare: baseline + 8, competitorShare: baseline + 12 },
    { label: "Day 45", citationShare: baseline + 12, competitorShare: baseline + 10 },
    { label: "Day 60", citationShare: baseline + 17, competitorShare: baseline + 8 },
  ];
}

export async function storeScore(score: ScoreRecord) {
  const scores = await readCollection("scores");
  scores.unshift(score);
  await writeCollection("scores", scores);
  await logJob("score.requested", {
    scoreId: score.id,
    url: score.url,
    comparisonUrl: score.comparison?.url ?? null,
  });
  return score;
}

export async function getScoreById(scoreId: string) {
  const scores = await readCollection("scores");
  return scores.find((score) => score.id === scoreId);
}

export async function captureLead(input: {
  email: string;
  name: string;
  score: number;
  scoreId: string;
  website: string;
}) {
  const leads = await readCollection("leads");
  const lead: LeadRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: input.name,
    email: input.email,
    website: input.website,
    scoreId: input.scoreId,
    score: input.score,
    source: "score-widget",
  };

  leads.unshift(lead);
  await writeCollection("leads", leads);

  await logJob("welcome-pdf", {
    leadId: lead.id,
    website: input.website,
    template: "welcome-pdf",
  });

  await logJob("follow-up-48h", {
    leadId: lead.id,
    website: input.website,
    template: "follow-up-48h",
    scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  });

  return lead;
}

export async function createAuditOrder(input: {
  companyName: string;
  email: string;
  name: string;
  scoreId?: string;
  status: "paid" | "failed";
  website: string;
}) {
  const orders = await readCollection("orders");
  const score = input.scoreId ? await getScoreById(input.scoreId) : undefined;

  let clientId: string | undefined;
  if (input.status === "paid") {
    const clients = await readCollection("clients");
    const trend = seededTrend(score?.overallScore ?? 28);
    const client: ClientRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      companyName: input.companyName || hostnameLabel(input.website),
      email: input.email,
      website: input.website,
      plan: "Audit",
      dashboardHeadline:
        "This portal shows the exact citation-share metrics the implementation team uses internally.",
      baselineCitationShare: trend[0].citationShare,
      currentCitationShare: trend[trend.length - 1].citationShare,
      citationGap:
        trend[trend.length - 1].competitorShare -
        trend[trend.length - 1].citationShare,
      trackedQueries: 25,
      trackedCompetitors: [
        `Best-performing ${hostnameLabel(input.website)} competitor`,
        "Category leader",
        "Emerging challenger",
      ],
      priorities: [
        "Ship FAQ schema and 12 transactional buyer questions on pricing and solution pages.",
        "Restructure hero copy and H2 hierarchy for extraction by ChatGPT, Claude, and Gemini.",
        "Add named proof points: customer count, case-study evidence, and leadership credibility.",
        "Launch two comparison pages covering your highest-value competitor-alternative queries.",
      ],
      monthlyDeliverables: [
        "Week 1: citation audit across Anthropic, OpenAI, Gemini, and Perplexity API outputs.",
        "Week 1-2: implementation sprint for schema, FAQ, pricing, and page structure fixes.",
        "Week 2-3: AI-optimized content creation for uncovered citation opportunities.",
        "Week 4: verification run, executive report, and next-month implementation plan.",
      ],
      apiKeyStatus: [
        { provider: "Anthropic", connected: false },
        { provider: "OpenAI", connected: false },
        { provider: "Gemini", connected: false },
      ],
      trend,
    };

    clients.unshift(client);
    await writeCollection("clients", clients);
    clientId = client.id;

    await logJob("audit.requested", {
      clientId,
      orderSource: "checkout",
      website: input.website,
    });

    await logJob("audit-confirmation", {
      clientId,
      email: input.email,
      template: "audit-confirmation",
    });
  }

  const order: OrderRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: input.name,
    email: input.email,
    companyName: input.companyName,
    website: input.website,
    amount: 2500,
    plan: "Audit",
    status: input.status,
    scoreId: input.scoreId,
    clientId,
  };

  orders.unshift(order);
  await writeCollection("orders", orders);
  return order;
}

export async function getOrderById(orderId: string) {
  const orders = await readCollection("orders");
  return orders.find((order) => order.id === orderId);
}

export async function getClientById(clientId: string) {
  const clients = await readCollection("clients");
  return clients.find((client) => client.id === clientId);
}
