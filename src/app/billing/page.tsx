"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Sparkles } from "lucide-react";
import Button from "@/components/Button";
import Logo from "@/components/Logo";

type Interval = "month" | "year";

const plans = [
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      "Up to 5 cleaners",
      "Unlimited properties",
      "Photo verification",
      "Email support",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    monthlyPrice: 99,
    yearlyPrice: 990,
    popular: true,
    features: [
      "Up to 15 cleaners",
      "Unlimited properties",
      "Photo verification",
      "Priority support",
      "Team analytics",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: 179,
    yearlyPrice: 1790,
    features: [
      "Unlimited cleaners",
      "Unlimited properties",
      "Photo verification",
      "Dedicated support",
      "Team analytics",
      "Custom branding",
    ],
  },
];

export default function BillingPage() {
  const [interval, setInterval] = useState<Interval>("month");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleChoosePlan(planKey: string) {
    setLoading(planKey);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Failed to create checkout session");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleManageSubscription() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Failed to open billing portal");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] bg-white">
        <Logo />
        <Button
          variant="ghost"
          size="sm"
          loading={loading === "portal"}
          onClick={handleManageSubscription}
        >
          Manage Subscription
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="text-center mb-10 max-w-lg">
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
            Your free trial has ended
          </h1>
          <p className="text-[#64748B]">
            Choose a plan to keep using Gleam and managing your cleaning
            business.
          </p>
        </div>

        {/* Interval toggle */}
        <div className="flex items-center gap-3 mb-10 bg-white rounded-xl border border-[#E2E8F0] p-1">
          <button
            onClick={() => setInterval("month")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              interval === "month"
                ? "bg-[#0EA5E9] text-white"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              interval === "year"
                ? "bg-[#0EA5E9] text-white"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Annual
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                interval === "year"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              2 months free
            </span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {plans.map((plan) => {
            const price =
              interval === "month"
                ? plan.monthlyPrice
                : Math.round(plan.yearlyPrice / 12);
            const totalYearly = plan.yearlyPrice;

            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-[#0EA5E9] shadow-lg shadow-[#0EA5E9]/10 ring-1 ring-[#0EA5E9]"
                    : "border-[#E2E8F0]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Sparkles size={12} />
                    Most Popular
                  </div>
                )}

                <h3 className="text-lg font-bold text-[#0F172A] mb-1">
                  {plan.name}
                </h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#0F172A]">
                    ${price}
                  </span>
                  <span className="text-[#64748B] text-sm">/mo</span>
                  {interval === "year" && (
                    <p className="text-xs text-[#64748B] mt-1">
                      ${totalYearly}/yr billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-[#334155]"
                    >
                      <Check size={14} className="text-[#0EA5E9] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.popular ? "primary" : "ghost"}
                  fullWidth
                  loading={loading === plan.key}
                  onClick={() => handleChoosePlan(plan.key)}
                >
                  Choose {plan.name}
                </Button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
