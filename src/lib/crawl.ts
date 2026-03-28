import { load } from "cheerio";
import puppeteer from "puppeteer";

import type { CrawlPage, CrawlResult } from "@/lib/scoring";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

function normalizeUrl(input: string) {
  const withProtocol =
    input.startsWith("http://") || input.startsWith("https://")
      ? input
      : `https://${input}`;
  return new URL(withProtocol).toString();
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchSitemapUrls(baseUrl: string) {
  try {
    const origin = new URL(baseUrl).origin;
    const xml = await fetchText(`${origin}/sitemap.xml`);
    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
      match[1].trim(),
    );
    return matches.slice(0, 20);
  } catch {
    return [];
  }
}

async function fetchLinkedUrls(baseUrl: string) {
  try {
    const html = await fetchText(baseUrl);
    const $ = load(html);
    const origin = new URL(baseUrl).origin;
    const links = $("a[href]")
      .toArray()
      .map((entry) => $(entry).attr("href") || "")
      .map((href) => {
        try {
          return new URL(href, origin).toString();
        } catch {
          return "";
        }
      })
      .filter((href) => href.startsWith(origin));

    return [...new Set(links)].slice(0, 20);
  } catch {
    return [];
  }
}

async function fetchRobots(origin: string) {
  try {
    const response = await fetch(`${origin}/robots.txt`, {
      cache: "no-store",
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return "";
    }

    return response.text();
  } catch {
    return "";
  }
}

async function fetchLlmsTxt(origin: string) {
  try {
    const response = await fetch(`${origin}/llms.txt`, {
      cache: "no-store",
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

function collectInternalLinks(html: string, baseUrl: string) {
  const $ = load(html);
  const origin = new URL(baseUrl).origin;
  const links = $("a[href]")
    .toArray()
    .map((entry) => $(entry).attr("href") || "")
    .map((href) => {
      try {
        return new URL(href, origin).toString();
      } catch {
        return "";
      }
    })
    .filter((href) => href.startsWith(origin));

  return [...new Set(links)];
}

async function fetchPageHtml(browser: Awaited<ReturnType<typeof puppeteer.launch>>, url: string) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, {
      timeout: 15_000,
      waitUntil: "domcontentloaded",
    });
    return await page.content();
  } finally {
    await page.close();
  }
}

function domainFromUrl(url: string) {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

export async function crawlWebsiteLight(input: string): Promise<CrawlResult> {
  const url = normalizeUrl(input);
  const origin = new URL(url).origin;
  const domain = domainFromUrl(url);

  try {
    const [homepage, robotsTxt, hasLlmsTxt] = await Promise.all([
      fetchText(url),
      fetchRobots(origin),
      fetchLlmsTxt(origin),
    ]);
    const internalLinks = collectInternalLinks(homepage, url).slice(0, 5);
    const pages: CrawlPage[] = [];

    for (const link of internalLinks) {
      try {
        const html = await fetchText(link);
        pages.push({ html, url: link });
      } catch {
        continue;
      }
    }

    return {
      html: homepage,
      url,
      domain,
      robotsTxt,
      hasLlmsTxt,
      pages,
      crawl_status: "success",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown crawl error";
    if (/403|cloudflare|access denied|forbidden/i.test(message)) {
      return {
        html: "",
        url,
        domain,
        robotsTxt: "",
        hasLlmsTxt: false,
        pages: [],
        crawl_status: "blocked",
      };
    }

    return {
      html: "",
      url,
      domain,
      robotsTxt: await fetchRobots(origin),
      hasLlmsTxt: await fetchLlmsTxt(origin),
      pages: [],
      crawl_status: "partial",
    };
  }
}

export async function crawlWebsite(input: string): Promise<CrawlResult> {
  const url = normalizeUrl(input);
  const origin = new URL(url).origin;
  const domain = domainFromUrl(url);
  const timeout = AbortSignal.timeout(15_000);

  try {
    const [robotsTxt, hasLlmsTxt] = await Promise.all([
      fetchRobots(origin),
      fetchLlmsTxt(origin),
    ]);

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true,
    });

    try {
      const homepage = await fetchPageHtml(browser, url);
      const internalLinks = collectInternalLinks(homepage, url).slice(0, 5);
      const pages: CrawlPage[] = [];

      for (const link of internalLinks) {
        try {
          const html = await fetchPageHtml(browser, link);
          pages.push({ html, url: link });
        } catch {
          continue;
        }
      }

      return {
        html: homepage,
        url,
        domain,
        robotsTxt,
        hasLlmsTxt,
        pages,
        crawl_status: "success",
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown crawl error";

    if (/403|cloudflare|access denied|forbidden/i.test(message)) {
      return {
        html: "",
        url,
        domain,
        robotsTxt: "",
        hasLlmsTxt: false,
        pages: [],
        crawl_status: "blocked",
      };
    }

    if (timeout.aborted || /timeout/i.test(message)) {
      return {
        html: "",
        url,
        domain,
        robotsTxt: await fetchRobots(origin),
        hasLlmsTxt: await fetchLlmsTxt(origin),
        pages: [],
        crawl_status: "partial",
      };
    }

    return {
      html: "",
      url,
      domain,
      robotsTxt: await fetchRobots(origin),
      hasLlmsTxt: await fetchLlmsTxt(origin),
      pages: [],
      crawl_status: "partial",
    };
  }
}

export async function discoverTopPages(input: string, limit = 12) {
  const baseUrl = normalizeUrl(input);
  const [sitemapUrls, linkedUrls] = await Promise.all([
    fetchSitemapUrls(baseUrl),
    fetchLinkedUrls(baseUrl),
  ]);

  const candidates = [baseUrl, ...sitemapUrls, ...linkedUrls];
  return [...new Set(candidates)].slice(0, limit);
}
