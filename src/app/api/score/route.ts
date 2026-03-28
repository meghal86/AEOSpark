import { NextResponse } from "next/server";

import { inngest } from "@/inngest/client";
import { processScoreRequested } from "@/inngest/functions/score-requested";
import { appEnv } from "@/lib/env";
import {
  createPendingScoreJob,
  findRecentScoreByDomain,
} from "@/lib/storage";
import { domainForScoring, normalizePublicUrl } from "@/lib/url-security";

async function dispatchScoreJob(scoreId: string, url: string) {
  const runInline = () => {
    void processScoreRequested({ scoreId, url }).catch((error) => {
      console.error("inline score processing failed", { scoreId, error });
    });
  };

  if (!appEnv.inngestEventKey || process.env.NODE_ENV !== "production") {
    runInline();
    return;
  }

  try {
    await Promise.race([
      inngest.send({
        name: "score/requested",
        data: { scoreId, url },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Inngest send timed out")), 1_500),
      ),
    ]);
  } catch (error) {
    console.error("score event dispatch failed, falling back inline", {
      scoreId,
      error,
    });
    runInline();
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: string };
    if (!body.url?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL. Please enter a valid URL including https://",
        },
        { status: 400 },
      );
    }

    const url = normalizePublicUrl(body.url);
    const domain = domainForScoring(url);
    const cached = await findRecentScoreByDomain(domain, 24);

    if (cached) {
      return NextResponse.json({
        success: true,
        data: { scoreId: cached.id, cached: true },
      });
    }

    const pending = await createPendingScoreJob({ domain, url });
    await dispatchScoreJob(pending.id, url);

    return NextResponse.json({
      success: true,
      data: { scoreId: pending.id, cached: false },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid URL. Please enter a valid URL including https://";

    console.error("score route error", error);

    if (message === "Please enter a public website URL") {
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 400 },
      );
    }

    if (/invalid url/i.test(message)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL. Please enter a valid URL including https://",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Unable to run score right now. Please try again in a minute.",
      },
      { status: 500 },
    );
  }
}
