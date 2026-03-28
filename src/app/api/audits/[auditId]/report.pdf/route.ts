import { NextResponse } from "next/server";

import { renderAuditPdf } from "@/lib/pdf-documents";
import { getAuditById } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await params;
  const audit = await getAuditById(auditId);

  if (!audit) {
    return NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }

  const pdf = await renderAuditPdf(audit);
  return new NextResponse(pdf as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${audit.companyName}-audit.pdf"`,
    },
  });
}
