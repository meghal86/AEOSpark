import { NextResponse } from "next/server";

import { createServerAuthClient } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/sign-in?status=signed-out", url.origin));
}
