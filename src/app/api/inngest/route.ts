import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { auditRequested } from "@/inngest/functions/audit-requested";
import { remeasureRequested } from "@/inngest/functions/remeasure-requested";
import { scoreRequested } from "@/inngest/functions/score-requested";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scoreRequested, auditRequested, remeasureRequested],
});
