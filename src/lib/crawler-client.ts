import { crawlWebsite, crawlWebsiteLight } from "@/lib/crawl";
import { appEnv } from "@/lib/env";
import type { CrawlResult } from "@/lib/scoring";

export async function fetchCrawlResult(url: string) {
  try {
    const response = await fetch(`${appEnv.crawlerServiceUrl}/crawl`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      throw new Error(`Crawler service returned ${response.status}`);
    }
    return (await response.json()) as CrawlResult;
  } catch {
    if (process.env.NODE_ENV === "production") {
      return crawlWebsiteLight(url);
    }

    return crawlWebsite(url);
  }
}
