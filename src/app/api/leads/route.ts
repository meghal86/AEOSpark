import { NextResponse } from "next/server";

import { sendLeadSummaryEmail } from "@/lib/email";
import { captureLead, getScoreById } from "@/lib/storage";

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

    const lead = await captureLead({
      email: body.email,
      name: body.name,
      score: body.score ?? 0,
      scoreId: body.scoreId ?? "",
      website: body.website,
    });

    const score = body.scoreId ? await getScoreById(body.scoreId) : undefined;
    if (score) {
      await sendLeadSummaryEmail({
        email: body.email,
        name: body.name,
        score,
      });
    }

    return NextResponse.json({ leadId: lead.id, ok: true });
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
