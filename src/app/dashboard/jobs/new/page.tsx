"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Building2, User, CalendarDays } from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import { properties, cleaners } from "@/lib/sampleData";

export default function NewJobPage() {
  const router = useRouter();
  const [propertyId, setPropertyId] = useState("");
  const [cleanerId, setCleanerId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const activeCleaners = cleaners.filter((c) => c.status === "active");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId || !cleanerId || !date) {
      toast.error("Fill in property, cleaner and date.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Job scheduled.");
      router.push("/dashboard/jobs");
    }, 800);
  }

  return (
    <>
      <OwnerTopbar title="Schedule job" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-4"
          >
            <ArrowLeft size={14} />
            Back to jobs
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A]">
              Schedule a new job
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Pick a property, assign a cleaner and set the date.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
                <Building2 size={14} className="text-[#64748B]" />
                Property
              </label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                required
              >
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.clientName} — {p.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
                <User size={14} className="text-[#64748B]" />
                Assigned cleaner
              </label>
              <select
                value={cleanerId}
                onChange={(e) => setCleanerId(e.target.value)}
                className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                required
              >
                <option value="">Select a cleaner</option>
                {activeCleaners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-[#64748B]" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#0F172A]">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/dashboard/jobs">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={saving}>
                Schedule job
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
