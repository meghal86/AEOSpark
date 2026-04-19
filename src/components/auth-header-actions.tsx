import Link from "next/link";

import { createServerAuthClient } from "@/lib/supabase-auth";

export async function AuthHeaderActions(props: {
  className?: string;
  linkClassName?: string;
  buttonClassName?: string;
}) {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const linkClassName =
    props.linkClassName ||
    "text-sm font-semibold text-stone-700 transition hover:text-stone-950";
  const buttonClassName =
    props.buttonClassName ||
    "btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition";

  if (user?.email) {
    return (
      <div className={props.className}>
        <Link className={linkClassName} href="/account">
          My Reports
        </Link>
        <Link className={buttonClassName} href="/sign-out">
          Sign out
        </Link>
      </div>
    );
  }

  return (
    <div className={props.className}>
      <Link className={linkClassName} href="/sign-in">
        Sign in
      </Link>
      <Link className={buttonClassName} href="/sign-up">
        Create account
      </Link>
    </div>
  );
}
