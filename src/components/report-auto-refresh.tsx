"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ReportAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [router]);

  return null;
}
