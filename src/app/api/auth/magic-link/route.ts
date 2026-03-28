import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { appEnv } from "@/lib/env";

const requestSchema = z.object({
  email: z.email(),
});

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase public auth configuration is required.");
  }

  return createClient(url, anonKey);
}

export async function POST(request: Request) {
  let email = "";

  try {
    const body = await request.json();
    email = requestSchema.parse(body).email;
  } catch {
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = createAnonClient();
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appEnv.appUrl}/auth/confirm?next=/account`,
      },
    });
  } catch {
    // Intentionally return success to avoid email enumeration and keep UX simple.
  }

  return NextResponse.json({ success: true });
}
