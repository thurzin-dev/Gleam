"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Filter } from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import ProgressBar from "@/components/ProgressBar";
import {
  jobs,
  cleaners,
  countProgress,
  statusLabel,
  statusVariant,
  JobStatus,
} from "@/lib/sampleData";

export default function JobsPage() {
  const [date, setDate] = useState<string>("");
  const [cleanerId, setCleanerId] = useState<string>("");
  const [status, setStatus] = useState<JobStatus | "">("");

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (date && j.date !== date) return false;
      if (cleanerId && j.cleanerId !== cleanerId) return false;
      if (status && j.status !== status) return false;
      return true;
    });
  }, [date, cleanerId, status]);

  const hasFilter = !!date || !!cleanerId || !!status;

  return (
    <>
      <OwnerTopbar title="Jobs" subtitle="All scheduled cleanings" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Jobs</h2>
              <p className="text-sm text-[#64748B] mt-1">
                {filtered.length} {filtered.length === 1 ? "job" : "jobs"}
                {hasFilter ? " (filtered)" : ""}
              </p>
            </div>
            <Link href="/dashboard/jobs/new">
              <Button variant="primary" size="md">
                <Plus size={16} />
                Schedule job
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
              <Filter size={15} />
              Filters
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
            <select
              value={cleanerId}
              onChange={(e) => setCleanerId(e.target.value)}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
            >
              <option value="">All cleaners</option>
              {cleaners.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus | "")}
              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
            >
              <option value="">All statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            {hasFilter && (
              <button
                className="ml-auto text-sm text-[#0EA5E9] hover:underline"
                onClick={() => {
                  setDate("");
                  setCleanerId("");
                  setStatus("");
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wide">
              <div className="col-span-2">Date</div>
              <div className="col-span-4">Property</div>
              <div className="col-span-2">Cleaner</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Progress</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#64748B]">
                No jobs match these filters.
              </div>
            ) : (
              <ul className="divide-y divide-[#F1F5F9]">
                {filtered.map((job) => {
                  const { done, total, pct } = countProgress(job.rooms);
                  return (
                    <li key={job.id}>
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
                      >
                        <div className="lg:col-span-2">
                          <p className="text-sm font-medium text-[#0F172A]">
                            {job.date}
                          </p>
                          <p className="text-xs text-[#64748B]">{job.time}</p>
                        </div>
                        <div className="lg:col-span-4 min-w-0">
                          <p className="text-sm text-[#0F172A] truncate">
                            {job.propertyAddress}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">
                            {job.clientName}
                          </p>
                        </div>
                        <div className="lg:col-span-2 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            {job.cleanerName
                              .split(" ")
                              .map((p) => p[0])
                              .join("")}
                          </div>
                          <span className="text-sm text-[#0F172A] truncate">
                            {job.cleanerName}
                          </span>
                        </div>
                        <div className="lg:col-span-2 flex items-center">
                          <Badge variant={statusVariant(job.status)} dot>
                            {statusLabel(job.status)}
                          </Badge>
                        </div>
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between text-xs text-[#64748B] mb-1">
                            <span>
                              {done}/{total}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <ProgressBar value={pct} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
