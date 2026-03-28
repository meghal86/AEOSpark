import { NextResponse } from "next/server";
import Stripe from "stripe";

import { inngest } from "@/inngest/client";
import { processAuditRequested } from "@/inngest/functions/audit-requested";
import { appEnv } from "@/lib/env";
import { sendAuditConfirmationEmail } from "@/lib/email-workflows";
import { getStripe } from "@/lib/stripe";
import {
  createOrder,
  getOrderByStripePaymentIntent,
  setClientActiveBySubscriptionId,
} from "@/lib/storage";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature || !appEnv.stripeWebhookSecret) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      appEnv.stripeWebhookSecret,
    );
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : "";

      if (paymentIntentId) {
        const existing = await getOrderByStripePaymentIntent(paymentIntentId);
        if (!existing) {
          const order = await createOrder({
            email: session.customer_details?.email || session.customer_email || "",
            name: session.metadata?.name,
            url: session.metadata?.url || "",
            stripePaymentIntentId: paymentIntentId,
            amountCents: 99_700,
            status: "pending",
          });

          if (appEnv.inngestEventKey) {
            await inngest.send({
              name: "audit/requested",
              data: {
                orderId: order.id,
                email: order.email,
                name: order.name,
                url: order.url,
              },
            });
          } else {
            void processAuditRequested({
              orderId: order.id,
              email: order.email,
              name: order.name ?? "",
              url: order.url,
            });
          }

          if (order.email && order.url) {
            await sendAuditConfirmationEmail({
              email: order.email,
              name: order.name ?? "there",
              orderId: order.id,
              url: order.url,
            });
          }
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await setClientActiveBySubscriptionId(subscription.id, false);
    } else if (event.type === "invoice.payment_succeeded") {
      // Intentionally no-op: successful recurring payment keeps clients active.
    }
  } catch (error) {
    console.error("stripe webhook handling error", error);
  }

  return NextResponse.json({ received: true });
}
