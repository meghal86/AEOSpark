import { NextResponse } from "next/server";

import { createServerAuthClient } from "@/lib/supabase-auth";

// Sign-out uses POST to prevent CSRF via link prefetch or img tags.
export async function POST(request: Request) {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/sign-in?status=signed-out", url.origin));
}

// Fallback for direct navigation (e.g. bookmarked /sign-out).
export async function GET(request: Request) {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/sign-in?status=signed-out", url.origin));
}
