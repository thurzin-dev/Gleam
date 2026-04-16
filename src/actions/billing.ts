"use server";

import { createClient } from "@/lib/supabase/server";
import { cleanerLimitForPlan } from "@/lib/stripe";

export type BillingInfo = {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  cleanerCount: number;
  cleanerLimit: number;
  isOverLimit: boolean;
};

export async function getBillingInfo(): Promise<BillingInfo | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "plan, subscription_status, trial_ends_at, current_period_end, stripe_customer_id"
    )
    .eq("id", profile.org_id)
    .single();

  if (!org) return null;

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("org_id", profile.org_id)
    .eq("role", "cleaner");

  const cleanerCount = count ?? 0;
  const limit = cleanerLimitForPlan(org.plan);

  return {
    plan: org.plan,
    subscriptionStatus: org.subscription_status,
    trialEndsAt: org.trial_ends_at,
    currentPeriodEnd: org.current_period_end,
    stripeCustomerId: org.stripe_customer_id,
    cleanerCount,
    cleanerLimit: limit === Infinity ? -1 : limit,
    isOverLimit: cleanerCount > limit,
  };
}

export async function checkCleanerLimit(): Promise<{
  allowed: boolean;
  message?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { allowed: false, message: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { allowed: false, message: "Profile not found" };

  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", profile.org_id)
    .single();

  if (!org) return { allowed: false, message: "Organization not found" };

  const limit = cleanerLimitForPlan(org.plan);
  if (limit === Infinity) return { allowed: true };

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("org_id", profile.org_id)
    .eq("role", "cleaner");

  const cleanerCount = count ?? 0;

  if (cleanerCount >= limit) {
    const planName = org.plan.charAt(0).toUpperCase() + org.plan.slice(1);
    return {
      allowed: false,
      message: `You've reached your ${planName} limit of ${limit} cleaners. Upgrade to add more.`,
    };
  }

  return { allowed: true };
}
