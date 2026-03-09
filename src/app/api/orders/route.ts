import { NextResponse } from "next/server";

import { createAuditOrder } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      companyName?: string;
      email?: string;
      name?: string;
      scoreId?: string;
      status?: "paid" | "failed";
      website?: string;
    };

    if (!body.email?.trim() || !body.name?.trim() || !body.website?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and website are required for checkout." },
        { status: 400 },
      );
    }

    const order = await createAuditOrder({
      companyName: body.companyName ?? "",
      email: body.email,
      name: body.name,
      scoreId: body.scoreId,
      status: body.status ?? "paid",
      website: body.website,
    });

    return NextResponse.json({
      clientId: order.clientId,
      orderId: order.id,
      status: order.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create the audit order.",
      },
      { status: 500 },
    );
  }
}
