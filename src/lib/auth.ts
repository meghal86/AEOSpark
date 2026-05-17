import { prisma } from "@/lib/prisma";
import {
  createBrowserAuthClient,
  createServerAuthClient,
} from "@/lib/supabase-auth";

export { createBrowserAuthClient, createServerAuthClient };

export async function getSession() {
  const supabase = await createServerAuthClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const user = await getUser();

  if (!user?.email) {
    return null;
  }

  const metadata = (user.user_metadata || {}) as {
    fullName?: string;
    name?: string;
    companyName?: string;
    company?: string;
    website?: string;
  };

  return prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      email: user.email,
      name: metadata.fullName || metadata.name || null,
      company: metadata.companyName || metadata.company || null,
      website: metadata.website || null,
    },
    update: {
      email: user.email,
      name: metadata.fullName || metadata.name || undefined,
      company: metadata.companyName || metadata.company || undefined,
      website: metadata.website || undefined,
    },
  });
}
