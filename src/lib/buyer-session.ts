export type BuyerSessionState = {
  email: string;
  orderReference: string;
  domain: string;
  status: "pending" | "processing" | "delivered";
  reportUrl?: string | null;
  savedAt: string;
};

export const BUYER_SESSION_KEY = "aeospark:buyer-session";

export function readBuyerSession(raw: string | null): BuyerSessionState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BuyerSessionState>;
    if (!parsed.email || !parsed.orderReference || !parsed.domain || !parsed.status) {
      return null;
    }

    return {
      email: parsed.email,
      orderReference: parsed.orderReference,
      domain: parsed.domain,
      status: parsed.status,
      reportUrl: parsed.reportUrl ?? null,
      savedAt: parsed.savedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
