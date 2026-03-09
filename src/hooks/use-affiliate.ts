import { useEffect } from "react";

const AFFILIATE_STORAGE_KEY = "shaadi_affiliate_ref";

/**
 * Captures affiliate referral code from URL params (?ref=CODE or ?coupon=CODE)
 * and stores in localStorage for later attribution on signup/upgrade.
 */
export function useCaptureAffiliate() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || params.get("coupon");
    if (ref) {
      localStorage.setItem(AFFILIATE_STORAGE_KEY, ref.trim().toLowerCase());
    }
  }, []);
}

export function getStoredAffiliateRef(): string | null {
  return localStorage.getItem(AFFILIATE_STORAGE_KEY);
}

export function clearStoredAffiliateRef() {
  localStorage.removeItem(AFFILIATE_STORAGE_KEY);
}

export function generateReferralCode(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${clean || "aff"}${rand}`;
}
