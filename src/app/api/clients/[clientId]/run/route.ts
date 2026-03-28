import { NextResponse } from "next/server";

import { runCitationMonitor } from "@/lib/citation-monitor";
import {
  getClientById,
  listCitationRunsForClient,
  storeCitationRun,
  updateClient,
} from "@/lib/storage";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;
  const client = await getClientById(clientId);

  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const previousRuns = await listCitationRunsForClient(clientId, 4);
  const run = await runCitationMonitor(client);
  await storeCitationRun(run);

  const trend = [...previousRuns]
    .reverse()
    .map((item, index) => ({
      label: `Run ${index + 1}`,
      citationShare: item.clientCitationShare,
      competitorShare: item.competitorCitationShare,
    }))
    .concat({
      label: `Run ${previousRuns.length + 1}`,
      citationShare: run.clientCitationShare,
      competitorShare: run.competitorCitationShare,
    })
    .slice(-5);

  await updateClient(clientId, {
    currentCitationShare: run.clientCitationShare,
    citationGap: run.competitorCitationShare - run.clientCitationShare,
    trackedQueries: run.queryCount,
    trend,
  });

  return NextResponse.json({ ok: true, runId: run.id });
}
