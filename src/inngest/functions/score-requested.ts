import { inngest } from "@/inngest/client";
import { fetchCrawlResult } from "@/lib/crawler-client";
import { scoreResultToRecord, scoreUrl } from "@/lib/scoring";
import { getScoreRowById, updateScoreJob } from "@/lib/storage";

export async function processScoreRequested(payload: {
  scoreId: string;
  url: string;
}) {
  const scoreRow = await getScoreRowById(payload.scoreId);
  if (!scoreRow) {
    throw new Error("Score job not found.");
  }

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Fetching your website...",
  });

  const crawlResult = await fetchCrawlResult(payload.url);

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Checking AI crawler access...",
    crawlStatus: crawlResult.crawl_status,
  });

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Analyzing structured data...",
  });

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Evaluating content architecture...",
  });

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Checking pricing transparency...",
  });

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Scanning authority signals...",
  });

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Checking Bing presence...",
  });

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Analyzing brand footprint...",
  });

  const scoreResult = await scoreUrl(crawlResult);

  await updateScoreJob(payload.scoreId, {
    jobStatus: "processing",
    jobStep: "Calculating your score...",
  });

  const appRecord = scoreResultToRecord({
    crawlResult,
    scoreId: payload.scoreId,
    scoreResult,
    createdAt: scoreRow.createdAt.toISOString(),
  });

  await updateScoreJob(payload.scoreId, {
    scoreTotal: scoreResult.total,
    scoreCrawlerAccess: scoreResult.dimensions.crawler_access,
    scoreStructuredData: scoreResult.dimensions.structured_data,
    scoreContentArch: scoreResult.dimensions.content_arch,
    scorePricing: scoreResult.dimensions.pricing,
    scoreAuthority: scoreResult.dimensions.authority,
    scoreBingPresence: scoreResult.dimensions.bing_presence,
    scoreBrandFootprint: scoreResult.dimensions.brand_footprint,
    scoreDetails: {
      appRecord,
      diagnoses: scoreResult.diagnoses,
      scoreResult,
    },
    crawlStatus: scoreResult.crawl_status,
    jobStatus: "complete",
    jobStep: null,
  });

  return payload.scoreId;
}

export const scoreRequested = inngest.createFunction(
  { id: "score-requested" },
  { event: "score/requested" },
  async ({ event }) => processScoreRequested(event.data as { scoreId: string; url: string }),
);
