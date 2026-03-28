import { createServer } from "node:http";

import { crawlWebsite } from "../../src/lib/crawl";

const port = Number(process.env.PORT || 4000);

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/crawl") {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  const chunks: Buffer[] = [];
  request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  request.on("end", async () => {
    try {
      const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
        url?: string;
      };

      if (!payload.url) {
        response.writeHead(400, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "URL is required." }));
        return;
      }

      const result = await crawlWebsite(payload.url);
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          html: "",
          robotsTxt: "",
          hasLlmsTxt: false,
          pages: [],
          url: "",
          domain: "",
          crawl_status: "partial",
          error: error instanceof Error ? error.message : "Unknown crawler failure",
        }),
      );
    }
  });
});

server.listen(port, () => {
  console.log(`AEOSpark crawler listening on ${port}`);
});
