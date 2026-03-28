import { NextResponse } from "next/server";

import { appEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { normalizePublicUrl } from "@/lib/url-security";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      url?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name is required." },
        { status: 400 },
      );
    }

    if (!body.email?.trim() || !isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: "A valid work email is required." },
        { status: 400 },
      );
    }

    const normalizedUrl = normalizePublicUrl(body.url || "");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: appEnv.stripeAuditPriceId
        ? [
            {
              price: appEnv.stripeAuditPriceId,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: "usd",
                unit_amount: 99_700,
                product_data: {
                  name: "AEOSpark Full AI Visibility Audit",
                  description:
                    "20 live AI queries + competitor citation comparison + 90-day roadmap",
                },
              },
              quantity: 1,
            },
          ],
      customer_email: body.email,
      success_url: `${appEnv.appUrl}/confirmation?order={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appEnv.appUrl}/checkout/audit`,
      metadata: {
        url: normalizedUrl,
        name: body.name.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { checkoutUrl: session.url },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to start checkout.",
      },
      { status: 400 },
    );
  }
}
