import { NextResponse } from "next/server";
import { z } from "zod";

import { isProductionEnv } from "@/lib/env";
import { createServerClient } from "@/lib/supabase";
import { normalizePublicUrl } from "@/lib/url-security";

const requestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  fullName: z.string().trim().min(1).max(120),
  companyName: z.string().trim().min(1).max(160),
  website: z.string().trim().min(1).max(240),
});

function isLocalRequest(request: Request) {
  const host = request.headers.get("host") || "";
  return host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
}

export async function POST(request: Request) {
  if (isProductionEnv() || !isLocalRequest(request)) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { success: false, error: "Enter valid account details." },
      { status: 400 },
    );
  }

  try {
    const supabase = createServerClient();
    const website = normalizePublicUrl(body.website);
    const { error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        fullName: body.fullName,
        companyName: body.companyName,
        website,
      },
    });

    if (error) {
      if (/already been registered|already exists|User already registered/i.test(error.message)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "An account already exists for this email. Sign in or reset your password.",
          },
          { status: 409 },
        );
      }

      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create the local test account.";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
