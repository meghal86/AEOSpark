import { NextResponse } from "next/server";

import { createScorecard } from "@/lib/scoring";
import { storeScore } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      competitorUrl?: string;
      url?: string;
    };

    if (!body.url?.trim()) {
      return NextResponse.json(
        { error: "A company URL is required." },
        { status: 400 },
      );
    }

    const score = await createScorecard(body.url, body.competitorUrl);
    await storeScore(score);

    return NextResponse.json({ scoreId: score.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete the AEO score request.",
      },
      { status: 500 },
    );
  }
}
