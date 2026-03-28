import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";

import { fetchCrawlResult } from "@/lib/crawler-client";
import { scoreUrl } from "@/lib/scoring";

const benchmarkSchema = z.array(
  z.object({
    id: z.string(),
    url: z.url(),
    notes: z.string(),
  }),
);

type BenchmarkEntry = z.infer<typeof benchmarkSchema>[number];

type BenchmarkDomainResult = {
  id: string;
  url: string;
  notes: string;
  total: number;
  grade: string;
  crawlStatus: string;
  dimensions: Record<string, number>;
  topStrength: string;
  topGap: string;
  diagnoses: Record<string, string>;
};

type ResearchRun = {
  generatedAt: string;
  benchmarkCount: number;
  averageScore: number;
  dimensionAverages: Record<string, number>;
  recommendedWork: Array<{
    dimension: string;
    average: number;
    reason: string;
  }>;
  domains: BenchmarkDomainResult[];
  deltasFromPrevious: {
    averageScoreDelta: number | null;
    domainScoreDeltas: Record<string, number>;
  };
};

function recommendedWorkFromRun(
  dimensionAverages: Record<string, number>,
  domains: BenchmarkDomainResult[],
) {
  const work: ResearchRun["recommendedWork"] = [];

  for (const [dimension, average] of Object.entries(dimensionAverages)) {
    const zeroCount = domains.filter((domain) => (domain.dimensions[dimension] ?? 0) === 0).length;

    if (zeroCount >= Math.ceil(domains.length * 0.8)) {
      work.push({
        dimension,
        average,
        reason: `This dimension scored 0 on ${zeroCount}/${domains.length} benchmark domains, which usually indicates a brittle detector rather than a real market-wide absence.`,
      });
      continue;
    }

    if (average <= 2) {
      work.push({
        dimension,
        average,
        reason: "The benchmark average is extremely low, so this detector likely needs broader evidence matching or better fallback logic.",
      });
    }
  }

  return work;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BENCHMARKS_FILE = path.join(__dirname, "benchmarks", "domains.json");
const RUNS_DIR = path.join(__dirname, "runs");

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function summarizeDimensions(dimensions: Record<string, number>) {
  const ordered = Object.entries(dimensions).sort((a, b) => b[1] - a[1]);
  return {
    topStrength: ordered[0]?.[0] ?? "n/a",
    topGap: ordered[ordered.length - 1]?.[0] ?? "n/a",
  };
}

async function loadBenchmarks() {
  const raw = await readFile(BENCHMARKS_FILE, "utf8");
  return benchmarkSchema.parse(JSON.parse(raw));
}

async function latestPriorRun() {
  try {
    const files = (await readdir(RUNS_DIR))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .reverse();

    if (!files.length) {
      return null;
    }

    const raw = await readFile(path.join(RUNS_DIR, files[0]), "utf8");
    return JSON.parse(raw) as ResearchRun;
  } catch {
    return null;
  }
}

async function evaluateBenchmark(entry: BenchmarkEntry): Promise<BenchmarkDomainResult> {
  const crawl = await fetchCrawlResult(entry.url);
  const score = await scoreUrl(crawl);
  const dimensionSummary = summarizeDimensions(score.dimensions);

  return {
    id: entry.id,
    url: entry.url,
    notes: entry.notes,
    total: score.total,
    grade: score.grade,
    crawlStatus: score.crawl_status,
    dimensions: score.dimensions,
    topStrength: dimensionSummary.topStrength,
    topGap: dimensionSummary.topGap,
    diagnoses: score.diagnoses,
  };
}

async function buildRun() {
  const benchmarks = await loadBenchmarks();
  const previous = await latestPriorRun();
  const domains: BenchmarkDomainResult[] = [];

  for (const entry of benchmarks) {
    process.stdout.write(`Scoring ${entry.id} (${entry.url})...\n`);
    domains.push(await evaluateBenchmark(entry));
  }

  const totals = domains.map((domain) => domain.total);
  const averageScore = round(
    totals.reduce((sum, value) => sum + value, 0) / Math.max(1, totals.length),
  );

  const dimensionKeys = Object.keys(domains[0]?.dimensions ?? {});
  const dimensionAverages = Object.fromEntries(
    dimensionKeys.map((key) => {
      const average =
        domains.reduce((sum, domain) => sum + (domain.dimensions[key] ?? 0), 0) /
        Math.max(1, domains.length);
      return [key, round(average)];
    }),
  );

  const previousDomainMap = new Map(
    (previous?.domains ?? []).map((domain) => [domain.id, domain.total]),
  );

  return {
    generatedAt: new Date().toISOString(),
    benchmarkCount: domains.length,
    averageScore,
    dimensionAverages,
    recommendedWork: recommendedWorkFromRun(dimensionAverages, domains),
    domains,
    deltasFromPrevious: {
      averageScoreDelta:
        previous?.averageScore !== undefined
          ? round(averageScore - previous.averageScore)
          : null,
      domainScoreDeltas: Object.fromEntries(
        domains.map((domain) => [
          domain.id,
          previousDomainMap.has(domain.id)
            ? round(domain.total - (previousDomainMap.get(domain.id) ?? 0))
            : 0,
        ]),
      ),
    },
  } satisfies ResearchRun;
}

async function main() {
  process.chdir(ROOT_DIR);

  const run = await buildRun();
  await mkdir(RUNS_DIR, { recursive: true });

  const stamp = run.generatedAt.replace(/[:.]/g, "-");
  const filePath = path.join(RUNS_DIR, `${stamp}.json`);
  await writeFile(filePath, `${JSON.stringify(run, null, 2)}\n`, "utf8");

  process.stdout.write(`\nSaved run to ${path.relative(ROOT_DIR, filePath)}\n`);
  process.stdout.write(`Average score: ${run.averageScore}\n`);
  process.stdout.write(
    `Average score delta vs previous: ${
      run.deltasFromPrevious.averageScoreDelta === null
        ? "n/a"
        : run.deltasFromPrevious.averageScoreDelta
    }\n`,
  );

  for (const domain of run.domains) {
    process.stdout.write(
      `- ${domain.id}: ${domain.total} (${domain.grade}) | top strength=${domain.topStrength} | top gap=${domain.topGap}\n`,
    );
  }

  if (run.recommendedWork.length) {
    process.stdout.write("\nRecommended work:\n");
    for (const item of run.recommendedWork) {
      process.stdout.write(
        `- ${item.dimension}: avg=${item.average} | ${item.reason}\n`,
      );
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
