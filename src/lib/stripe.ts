import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

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
