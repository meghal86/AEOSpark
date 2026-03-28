import { Inngest } from "inngest";

import { appEnv } from "@/lib/env";

export const inngest = new Inngest({
  id: "aeospark",
  eventKey: appEnv.inngestEventKey,
});
