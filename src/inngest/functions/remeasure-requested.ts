import { Prisma } from "@prisma/client";

import { inngest } from "@/inngest/client";
import {
  runCitationQueryPair,
  summarizeCitationResults,
  type QueryPairResult,
} from "@/lib/audit-query-runner";
import { prisma } from "@/lib/prisma";

function domainFromUrl(url: string) {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

function extractQueries(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) =>
      row && typeof row === "object" && "query" in row
        ? String((row as { query?: unknown }).query || "")
        : "",
    )
    .filter(Boolean)
    .slice(0, 20);
}

async function getBaselineQueries(orderId: string) {
  const audit = await prisma.auditResult.findFirst({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  const queries = [
    ...extractQueries(audit?.claudeQueries),
    ...extractQueries(audit?.chatgptQueries),
  ];

  return [...new Set(queries)].slice(0, 20);
}

export const remeasureRequested = inngest.createFunction(
  { id: "remeasure-requested" },
  { event: "remeasure/requested" },
  async ({ event, step }) => {
    const payload = event.data as {
      orderId: string;
      userId: string;
    };

    const order = await step.run("load-order", async () =>
      prisma.order.findUnique({ where: { id: payload.orderId } }),
    );

    if (!order) {
      throw new Error("Order not found.");
    }

    const domain = domainFromUrl(order.url);
    const queries = await step.run("load-baseline-queries", async () =>
      getBaselineQueries(order.id),
    );

    if (queries.length === 0) {
      throw new Error("No baseline audit queries found for this order.");
    }

    const results = await step.run("run-citation-queries", async () => {
      const settled = await Promise.allSettled(
        queries.map((query) => runCitationQueryPair(query, domain)),
      );
      return settled
        .filter((result): result is PromiseFulfilledResult<QueryPairResult> =>
          result.status === "fulfilled",
        )
        .map((result) => result.value);
    });

    if (results.length === 0) {
      throw new Error("No citation queries completed.");
    }

    await step.run("store-score-history", async () => {
      const summary = summarizeCitationResults(results);
      const existingRuns = await prisma.scoreHistory.count({
        where: { orderId: order.id },
      });
      const [comp1, comp2] = summary.topCompetitors;
      const totalProviderRuns = Math.max(results.length * 2, 1);

      return prisma.scoreHistory.create({
        data: {
          userId: payload.userId,
          domain,
          orderId: order.id,
          runNumber: existingRuns + 1,
          citationClaude: summary.claudeShare,
          citationChatgpt: summary.chatgptShare,
          comp1Domain: comp1?.[0] ?? null,
          comp1Share: comp1 ? Math.round((comp1[1] / totalProviderRuns) * 100) : null,
          comp2Domain: comp2?.[0] ?? null,
          comp2Share: comp2 ? Math.round((comp2[1] / totalProviderRuns) * 100) : null,
          queryResults: results as unknown as Prisma.InputJsonValue,
        },
      });
    });

    return { ok: true };
  },
);
