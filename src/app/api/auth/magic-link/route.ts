import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { appEnv, isProductionEnv } from "@/lib/env";
import { normalizePublicUrl } from "@/lib/url-security";

const requestSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(1).max(120).optional(),
  companyName: z.string().trim().min(1).max(160).optional(),
  website: z.string().trim().min(1).max(240).optional(),
});

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public auth configuration is required.");
  }

  return createClient(url, anonKey);
}

function baseUrlFromRequest(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers.get("host");
  if (host) {
    const protocol =
      host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return appEnv.appUrl;
}

export async function POST(request: Request) {
  let email = "";
  let fullName = "";
  let companyName = "";
  let website = "";

  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);
    email = parsed.email;
    fullName = parsed.fullName || "";
    companyName = parsed.companyName || "";
    website = parsed.website ? normalizePublicUrl(parsed.website) : "";
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Enter a valid email and website.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  try {
    const supabase = createAnonClient();
    const baseUrl = baseUrlFromRequest(request);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/confirm?next=/account`,
        data: {
          fullName,
          companyName,
          website,
        },
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send the access link.";

    console.error("Magic link error:", message);

    if (isProductionEnv()) {
      // Avoid account enumeration in production.
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
