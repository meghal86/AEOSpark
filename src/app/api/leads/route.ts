import { NextResponse } from "next/server";

import { captureLead } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      score?: number;
      scoreId?: string;
      website?: string;
    };

    if (!body.email?.trim() || !body.name?.trim() || !body.website?.trim()) {
      return NextResponse.json(
        { error: "Name, business email, and website are required." },
        { status: 400 },
      );
    }

    await captureLead({
      email: body.email,
      name: body.name,
      score: body.score ?? 0,
      scoreId: body.scoreId ?? "",
      website: body.website,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to store the lead record.",
      },
      { status: 500 },
    );
  }
}
