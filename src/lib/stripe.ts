import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

/**
 * Lazy Stripe client. Throws a clear error if STRIPE_SECRET_KEY is missing,
 * instead of the opaque "Neither apiKey nor config.authenticator provided"
 * that the Stripe SDK emits. Callers in API routes should catch this and
 * return a 500 with the message.
 */
export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Stripe is not configured: STRIPE_SECRET_KEY is missing from environment"
    );
  }

  cachedStripe = new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
  return cachedStripe;
}

/**
 * Proxy so existing `import { stripe } from "@/lib/stripe"` call sites keep
 * working. Any method access resolves through `getStripe()` at call time —
 * the client is never built during module load, so a missing env var
 * produces a clear error at the call site rather than a crash on import.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe() as unknown as Record<string | symbol, unknown>;
    const value = client[prop as string];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : Reflect.get(client as object, prop, receiver);
  },
});

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "Stripe webhooks are not configured: STRIPE_WEBHOOK_SECRET is missing from environment"
    );
  }
  return secret;
}

export const PLANS = {
  starter: {
    name: "Starter",
    cleanerLimit: 5,
    monthlyPrice: 4900,
    yearlyPrice: 49000,
  },
  growth: {
    name: "Growth",
    cleanerLimit: 15,
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    popular: true,
  },
  pro: {
    name: "Pro",
    cleanerLimit: Infinity,
    monthlyPrice: 17900,
    yearlyPrice: 179000,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export const OVERAGE_UNIT_PRICE = 900; // $9 per extra cleaner

export function cleanerLimitForPlan(plan: string): number {
  if (plan in PLANS) return PLANS[plan as PlanKey].cleanerLimit;
  return 0;
}
