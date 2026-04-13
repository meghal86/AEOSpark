"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function PageUtilityNav(props?: { homeHref?: string }) {
  const router = useRouter();
  const homeHref = props?.homeHref || "/";

  function handleBack() {
    if (typeof window === "undefined") {
      router.push(homeHref);
      return;
    }

    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        if (referrerUrl.origin === window.location.origin) {
          router.back();
          return;
        }
      } catch {
        // Fall through to home.
      }
    }

    router.push(homeHref);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
        onClick={handleBack}
        type="button"
      >
        Back
      </button>
      <Link
        className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
        href={homeHref}
      >
        Home
      </Link>
      <Link
        className="btn-secondary inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
        href="/account"
      >
        My Reports
      </Link>
    </div>
  );
}
