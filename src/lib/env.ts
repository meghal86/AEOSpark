const DEFAULT_ENCRYPTION_KEY = "aeospark-local-dev-encryption-key-32";

const derivedAppUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const appEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || derivedAppUrl,
  crawlerServiceUrl: process.env.CRAWLER_SERVICE_URL || "http://localhost:4000",
  calendlyUrl:
    process.env.CALENDLY_URL ||
    process.env.NEXT_PUBLIC_CALENDLY_URL ||
    "https://calendly.com",
  emailFrom: process.env.AEOSPARK_EMAIL_FROM || "",
  resendApiKey: process.env.RESEND_API_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  stripeAuditPriceId: process.env.STRIPE_AUDIT_PRICE_ID,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  encryptionKey: process.env.AEOSPARK_ENCRYPTION_KEY || DEFAULT_ENCRYPTION_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  inngestEventKey: process.env.INNGEST_EVENT_KEY,
  inngestSigningKey: process.env.INNGEST_SIGNING_KEY,
};

export function hasResend() {
  return Boolean(appEnv.resendApiKey);
}

export function hasStripe() {
  return Boolean(appEnv.stripeSecretKey && appEnv.stripePublishableKey);
}

export function hasOfficialLlmKeys() {
  return Boolean(
    appEnv.openAiApiKey || appEnv.anthropicApiKey || appEnv.googleApiKey,
  );
}

export function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export function assertProductionSenderConfig() {
  if (!isProductionEnv()) return;

  if (!appEnv.emailFrom || appEnv.emailFrom.includes("resend.dev")) {
    throw new Error(
      "AEOSPARK_EMAIL_FROM must be set to a verified sender domain in production.",
    );
  }
}

export function assertProductionEncryptionConfig() {
  if (!isProductionEnv()) return;

  if (!appEnv.encryptionKey || appEnv.encryptionKey === DEFAULT_ENCRYPTION_KEY) {
    throw new Error(
      "AEOSPARK_ENCRYPTION_KEY must be set to a unique production secret.",
    );
  }
}

export function assertPaidDeliveryConfig() {
  assertProductionSenderConfig();
  assertProductionEncryptionConfig();

  if (!appEnv.resendApiKey) {
    throw new Error("RESEND_API_KEY is required for paid delivery.");
  }
}
