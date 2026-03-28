import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const HOUR_MS = 60 * 60 * 1000;
const RATE_LIMIT = 10;

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function hitUpstashRateLimit(ip: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const key = `aeospark:score-rate:${ip}`;
  const ttlSeconds = 60 * 60;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const increment = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers,
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, ttlSeconds],
    ]),
    cache: "no-store",
  });

  if (!increment.ok) {
    return null;
  }

  const payload = (await increment.json()) as Array<{ result?: number }>;
  return payload[0]?.result ?? null;
}

function hitInMemoryRateLimit(ip: string) {
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + HOUR_MS });
    return 1;
  }

  current.count += 1;
  rateLimitStore.set(ip, current);
  return current.count;
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/api/score") {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const count = (await hitUpstashRateLimit(ip)) ?? hitInMemoryRateLimit(ip);

  if (count > RATE_LIMIT) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please wait before checking another URL.",
      },
      { status: 429 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/score"],
};
