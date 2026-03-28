import { Resend } from "resend";

import {
  appEnv,
  assertPaidDeliveryConfig,
  assertProductionSenderConfig,
  hasResend,
} from "@/lib/env";

function resendClient() {
  return hasResend() ? new Resend(appEnv.resendApiKey) : null;
}

function requirePaidEmailClient() {
  assertPaidDeliveryConfig();
  const client = resendClient();
  if (!client) {
    throw new Error("RESEND_API_KEY is required for paid email delivery.");
  }
  return client;
}

export async function sendAuditConfirmationEmail(input: {
  email: string;
  name: string;
  orderId: string;
  url: string;
}) {
  assertProductionSenderConfig();
  const client = requirePaidEmailClient();

  await client.emails.send({
    from: appEnv.emailFrom,
    to: input.email,
    subject: "Your AEO Audit is being prepared — expect it within 24 hours",
    html: `
      <p>Hi ${input.name},</p>
      <p>Your AEOSpark audit is now in progress for <strong>${input.url}</strong>.</p>
      <p>Order ID: <strong>${input.orderId}</strong></p>
      <p>Citation Share measures how often AI assistants mention your brand when customers ask category, review, and comparison questions.</p>
      <p><a href="${appEnv.calendlyUrl}">Book your strategy call</a></p>
    `,
  });

  return { mode: "resend" as const };
}

export async function sendAuditDeliveredEmail(input: {
  email: string;
  name: string;
  domain: string;
  reportUrl: string;
  pdfUrl: string | null;
  accountUrl: string;
  claudeCited: number;
  chatgptCited: number;
  competitorName: string | null;
  competitorCitations: number;
  executiveSummary: string;
}) {
  const client = requirePaidEmailClient();

  const competitorLine = input.competitorName
    ? `${input.competitorName} was cited in ${input.competitorCitations}/40 total query responses.`
    : "Competitor citation pressure is detailed inside the report.";
  const summaryPreview = input.executiveSummary.slice(0, 200);

  await client.emails.send({
    from: appEnv.emailFrom,
    to: input.email,
    subject: `Your AEO Audit for ${input.domain} is ready`,
    html: `
      <p>Hi ${input.name},</p>
      <p>Your AI visibility report is ready.</p>
      <p>
        Claude cited you in <strong>${input.claudeCited}/20</strong> queries.<br />
        ChatGPT cited you in <strong>${input.chatgptCited}/20</strong> queries.<br />
        ${competitorLine}
      </p>
      <p>${summaryPreview}${input.executiveSummary.length > 200 ? "..." : ""}</p>
      <p>
        <a href="${input.reportUrl}">View your full report</a>
      </p>
      ${
        input.pdfUrl
          ? `<p><a href="${input.pdfUrl}">Download the PDF</a></p>`
          : ""
      }
      <p><a href="${input.accountUrl}">View all reports in your account</a></p>
      <p>
        Your citation share vs top competitors is inside. We also identified the exact
        queries where ${input.competitorName || "competitors"} are being recommended
        instead of you.
      </p>
      <p><a href="${appEnv.calendlyUrl}">Book strategy call</a></p>
      <p>Questions? hello@aeospark.com</p>
    `,
  });

  return { mode: "resend" as const };
}
