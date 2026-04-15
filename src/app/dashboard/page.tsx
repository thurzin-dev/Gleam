import Link from "next/link";
import { CalendarClock, Users2, AlertTriangle, ArrowUpRight } from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";
import {
  jobs,
  cleaners,
  countProgress,
  statusLabel,
  statusVariant,
} from "@/lib/sampleData";

const TODAY = "2026-04-15";

export default function DashboardHome() {
  const todaysJobs = jobs.filter((j) => j.date === TODAY);
  const activeCleaners = cleaners.filter((c) => c.status === "active").length;
  const pendingIssues = todaysJobs.filter(
    (j) => j.status === "in_progress" || j.status === "not_started"
  ).length;

  const stats = [
    {
      label: "Today's jobs",
      value: todaysJobs.length,
      icon: CalendarClock,
      accent: "from-[#38BDF8]/15 to-[#0EA5E9]/10",
      iconColor: "text-[#0EA5E9]",
      delta: "+2 vs. yesterday",
    },
    {
      label: "Active cleaners",
      value: activeCleaners,
      icon: Users2,
      accent: "from-[#818CF8]/15 to-[#6366F1]/10",
      iconColor: "text-[#6366F1]",
      delta: `${cleaners.length - activeCleaners} invited`,
    },
    {
      label: "Pending issues",
      value: pendingIssues,
      icon: AlertTriangle,
      accent: "from-amber-200/40 to-amber-100/40",
      iconColor: "text-amber-500",
      delta: "Needs attention",
    },
  ];

  return (
    <>
      <OwnerTopbar title="Dashboard" subtitle="Monday, April 15 2026" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Greeting */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A]">
              Good morning, Sarah
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              Here&apos;s what&apos;s happening across your team today.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, accent, iconColor, delta }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center`}
                  >
                    <Icon size={18} className={iconColor} />
                  </div>
                  <span className="text-xs text-[#94A3B8]">{delta}</span>
                </div>
                <div>
                  <p className="text-sm text-[#64748B]">{label}</p>
                  <p className="text-3xl font-bold text-[#0F172A] mt-1">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Today's jobs */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">
                  Today&apos;s jobs
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Live progress across all properties
                </p>
              </div>
              <Link
                href="/dashboard/jobs"
                className="text-sm font-medium text-[#0EA5E9] hover:underline flex items-center gap-1"
              >
                View all
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <ul className="divide-y divide-[#F1F5F9]">
              {todaysJobs.map((job) => {
                const { done, total, pct } = countProgress(job.rooms);
                return (
                  <li key={job.id}>
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="flex flex-col lg:flex-row lg:items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 lg:w-72">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {job.cleanerName
                            .split(" ")
                            .map((p) => p[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0F172A] truncate">
                            {job.cleanerName}
                          </p>
                          <p className="text-xs text-[#64748B]">{job.time}</p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0F172A] truncate">
                          {job.propertyAddress}
                        </p>
                        <p className="text-xs text-[#64748B] truncate">
                          {job.clientName}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 lg:w-72">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={statusVariant(job.status)} dot>
                              {statusLabel(job.status)}
                            </Badge>
                            <span className="text-xs font-medium text-[#64748B]">
                              {done}/{total}
                            </span>
                          </div>
                          <ProgressBar value={pct} />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
