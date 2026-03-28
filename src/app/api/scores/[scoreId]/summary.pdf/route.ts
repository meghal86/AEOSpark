import { NextResponse } from "next/server";

import { renderScoreSummaryPdf } from "@/lib/pdf-documents";
import { getScoreById } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scoreId: string }> },
) {
  const { scoreId } = await params;
  const score = await getScoreById(scoreId);

  if (!score) {
    return NextResponse.json({ error: "Score not found." }, { status: 404 });
  }

  const pdf = await renderScoreSummaryPdf(score);
  return new NextResponse(pdf as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${score.publicSlug}-summary.pdf"`,
    },
  });
}
