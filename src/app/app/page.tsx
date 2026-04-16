"use client";

import Link from "next/link";
import { MapPin, Clock, ChevronRight, LogOut } from "lucide-react";
import Logo from "@/components/Logo";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";
import {
  jobs,
  countProgress,
  statusLabel,
  statusVariant,
  getToday,
  formatDateLabel,
} from "@/lib/sampleData";

const CLEANER_ID = "c1";
const CLEANER_NAME = "Maria";

export default function CleanerHome() {
  const today = getToday();
  const todaysJobs = jobs.filter(
    (j) => j.date === today && j.cleanerId === CLEANER_ID
  );
  const { pct } = countProgress(todaysJobs.flatMap((j) => j.rooms));

  return (
    <>
      <header className="flex items-center justify-between px-5 py-5 bg-white border-b border-[#E2E8F0]">
        <Logo size="md" />
        <Link
          href="/login"
          className="p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9]"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </Link>
      </header>

      <div className="px-5 py-6 flex-1">
        <div className="mb-6">
          <p className="text-sm text-[#64748B]">{formatDateLabel(today)}</p>
          <h1 className="text-2xl font-bold text-[#0F172A] mt-1">
            Hi, {CLEANER_NAME}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            You have {todaysJobs.length} {todaysJobs.length === 1 ? "job" : "jobs"} today.
          </p>
        </div>

        {/* Daily progress summary */}
        <div className="bg-gradient-to-br from-[#0EA5E9] to-[#6366F1] rounded-2xl p-5 text-white mb-6 shadow-sm">
          <p className="text-xs uppercase tracking-wide opacity-80">
            Today&apos;s progress
          </p>
          <p className="text-3xl font-bold mt-1">{pct}%</p>
          <div className="h-2 bg-white/25 rounded-full mt-3 overflow-hidden">
            <div
              className="h-2 bg-white rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <h2 className="text-sm font-semibold text-[#0F172A] uppercase tracking-wide mb-3">
          Your jobs
        </h2>

        {todaysJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center">
            <p className="text-sm text-[#64748B]">No jobs scheduled for today.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {todaysJobs.map((job) => {
              const { done, total, pct } = countProgress(job.rooms);
              return (
                <li key={job.id}>
                  <Link
                    href={`/app/job/${job.id}`}
                    className="block bg-white rounded-2xl border border-[#E2E8F0] p-5 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin
                          size={16}
                          className="text-[#0EA5E9] mt-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-[#0F172A] leading-tight">
                            {job.clientName}
                          </p>
                          <p className="text-sm text-[#64748B] mt-0.5">
                            {job.propertyAddress}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-[#CBD5E1] flex-shrink-0 mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <Badge variant={statusVariant(job.status)} dot>
                        {statusLabel(job.status)}
                      </Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                        <Clock size={13} />
                        {job.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 mb-1.5">
                      <span className="text-xs text-[#64748B]">
                        {done} of {total} items done
                      </span>
                      <span className="text-xs font-semibold text-[#0F172A]">
                        {pct}%
                      </span>
                    </div>
                    <ProgressBar value={pct} height="md" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
