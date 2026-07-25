// Shared helper: reads admin-configurable billing term lengths (months)
// from public.billing_terms. Falls back to 6/6 when unavailable.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type BillingTerms = { premium_months: number; storage_months: number };

const DEFAULT_TERMS: BillingTerms = { premium_months: 6, storage_months: 6 };

export async function getBillingTerms(client?: SupabaseClient): Promise<BillingTerms> {
  try {
    const c =
      client ??
      createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
    const { data, error } = await c
      .from("billing_terms")
      .select("premium_months, storage_months")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data) return DEFAULT_TERMS;
    return {
      premium_months: Number(data.premium_months) || DEFAULT_TERMS.premium_months,
      storage_months: Number(data.storage_months) || DEFAULT_TERMS.storage_months,
    };
  } catch (_e) {
    return DEFAULT_TERMS;
  }
}

export function plusMonthsISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}