import { Resend } from "resend";

import { appEnv, hasResend } from "@/lib/env";
import type { ScoreRecord } from "@/lib/types";

function resendClient() {
  return hasResend() ? new Resend(appEnv.resendApiKey) : null;
}

export async function sendLeadSummaryEmail(input: {
  email: string;
  name: string;
  score: ScoreRecord;
}) {
  const client = resendClient();
  if (!client) {
    return { mode: "mock" as const };
  }

  const summaryUrl = `${appEnv.appUrl}/api/scores/${input.score.id}/summary.pdf`;
  const resultsUrl = `${appEnv.appUrl}/score/${input.score.id}`;

  await client.emails.send({
    from: appEnv.emailFrom,
    to: input.email,
    subject: `Your AEO Score is ${input.score.overallScore}/100`,
    html: `
      <p>Hi ${input.name},</p>
      <p>Your score for <strong>${input.score.companyName}</strong> is <strong>${input.score.overallScore}/100</strong>.</p>
      <p><a href="${resultsUrl}">View your full results</a></p>
      <p><a href="${summaryUrl}">Download your PDF summary</a></p>
      <p><a href="${input.score.calendlyUrl}">Book a strategy call</a></p>
    `,
  });

  return { mode: "resend" as const };
}
