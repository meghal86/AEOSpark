import { NextResponse } from "next/server";

import { processScoreRequested } from "@/inngest/functions/score-requested";
import { getScoreRowById } from "@/lib/storage";

const recoveringScoreJobs = new Set<string>();

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ scoreId: string }> },
) {
  const { scoreId } = await context.params;

  if (!isUuid(scoreId)) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }

  const row = await getScoreRowById(scoreId);

  if (!row) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }

  const jobAgeMs = Date.now() - row.createdAt.getTime();
  const shouldRecoverStalledJob =
    (row.jobStatus === "pending" && jobAgeMs > 5_000) ||
    (row.jobStatus === "processing" && jobAgeMs > 45_000 && !row.scoreDetails);

  if (shouldRecoverStalledJob && !recoveringScoreJobs.has(scoreId)) {
    recoveringScoreJobs.add(scoreId);
    void processScoreRequested({ scoreId, url: row.url })
      .catch((error) => {
        console.error("score recovery failed", { scoreId, error });
      })
      .finally(() => {
        recoveringScoreJobs.delete(scoreId);
      });
  }

  if (row.jobStatus === "pending" || row.jobStatus === "processing") {
    return NextResponse.json({
      success: true,
      data: {
        status: "processing",
        step: row.jobStep || "Fetching your website...",
      },
    });
  }

  const details =
    row.scoreDetails && typeof row.scoreDetails === "object"
      ? (row.scoreDetails as {
          diagnoses?: Record<string, string>;
          scoreResult?: {
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
            crawl_status: "success" | "partial" | "blocked";
          };
        })
      : {};

  if (!details.scoreResult) {
    return NextResponse.json({
      success: true,
      data: {
        status: "processing",
        step: "Calculating your score...",
      },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      status: "complete",
      score: {
        total: details.scoreResult.total,
        grade: details.scoreResult.grade,
        dimensions: details.scoreResult.dimensions,
        diagnoses: details.diagnoses ?? {},
        crawl_status: details.scoreResult.crawl_status,
      },
    },
  });
}
