"use client";

import { useEffect } from "react";

import { BUYER_SESSION_KEY, type BuyerSessionState } from "@/lib/buyer-session";

export function BuyerSessionSync(props: BuyerSessionState) {
  useEffect(() => {
    window.localStorage.setItem(
      BUYER_SESSION_KEY,
      JSON.stringify({
        ...props,
        savedAt: props.savedAt || new Date().toISOString(),
      }),
    );
  }, [props]);

  return null;
}
