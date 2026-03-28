import Stripe from "stripe";

import { appEnv } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!appEnv.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  if (!stripe) {
    stripe = new Stripe(appEnv.stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
    });
  }

  return stripe;
}
