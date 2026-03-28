import { NextResponse } from "next/server";

import { createServerAuthClient } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/account";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const redirectUrl = new URL(next, url.origin);

  try {
    const supabase = await createServerAuthClient();

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "magiclink" | "recovery" | "invite" | "email" | "email_change",
      });
    }
  } catch {
    redirectUrl.searchParams.set("error", "auth");
  }

  return NextResponse.redirect(redirectUrl);
}
