import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const HOUR_MS = 60 * 60 * 1000;
const RATE_LIMIT = 10;
const PROTECTED_ROUTES = ["/account"];
const AUTH_ROUTES = ["/sign-in", "/sign-up"];

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
  const pathname = request.nextUrl.pathname;

  if (pathname === "/api/score") {
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

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (AUTH_ROUTES.includes(pathname) && user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/api/score", "/account/:path*", "/sign-in", "/sign-up"],
};
