"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, AlertTriangle, Users, ArrowUpRight } from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import { getBillingInfo, type BillingInfo } from "@/actions/billing";

export default function PlanSettingsPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBillingInfo()
      .then((info) => {
        if (!cancelled) setBilling(info);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load billing info.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Failed to open portal");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <OwnerTopbar title="Plan & Billing" subtitle="Manage your subscription" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-[#64748B]">Loading...</div>
        </div>
      </>
    );
  }

  if (!billing) {
    return (
      <>
        <OwnerTopbar title="Plan & Billing" subtitle="Manage your subscription" />
        <div className="flex-1 flex items-center justify-center text-[#64748B]">
          Unable to load billing information.
        </div>
      </>
    );
  }

  const planName = billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1);
  const limitLabel =
    billing.cleanerLimit === -1 ? "Unlimited" : `${billing.cleanerLimit}`;
  const nextBilling = billing.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <>
      <OwnerTopbar title="Plan & Billing" subtitle="Manage your subscription" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Overage warning */}
          {billing.isOverLimit && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  You have {billing.cleanerCount - (billing.cleanerLimit === -1 ? billing.cleanerCount : billing.cleanerLimit)} cleaner(s) above your plan limit
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  $9 per extra cleaner will be added to your next invoice.
                  Upgrade your plan to increase the limit.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  loading={portalLoading}
                  onClick={openPortal}
                >
                  <ArrowUpRight size={14} />
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}

          {/* Current plan card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center">
                <CreditCard size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Current Plan</h2>
                <p className="text-xs text-[#64748B]">Your subscription details</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-[#64748B] mb-1">Plan</p>
                <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                  {planName}
                  <Badge
                    variant={
                      billing.subscriptionStatus === "active"
                        ? "success"
                        : billing.subscriptionStatus === "past_due"
                          ? "warning"
                          : "neutral"
                    }
                    dot
                  >
                    {billing.subscriptionStatus}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Cleaner Limit</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {limitLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Active Cleaners</p>
                <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Users size={14} />
                  {billing.cleanerCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#64748B] mb-1">Next Billing</p>
                <p className="text-sm font-semibold text-[#0F172A]">
                  {nextBilling ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button loading={portalLoading} onClick={openPortal}>
              <ArrowUpRight size={14} />
              Upgrade Plan
            </Button>
            <Button variant="ghost" loading={portalLoading} onClick={openPortal}>
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
