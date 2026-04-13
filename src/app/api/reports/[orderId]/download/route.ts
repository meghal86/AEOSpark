import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase";
import { getOrderByReference } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = await getOrderByReference(orderId);

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Report not found." },
      { status: 404 },
    );
  }

  const supabase = createServerClient();
  const path = `${order.id}/report.pdf`;
  const signed = await supabase.storage
    .from("audit-reports")
    .createSignedUrl(path, 60 * 10);

  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json(
      {
        success: false,
        error: signed.error?.message || "Unable to create a report download link.",
      },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.data.signedUrl, 302);
}
