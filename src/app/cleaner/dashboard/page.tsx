import { ClipboardList, CheckCircle2, Clock, Star, ChevronRight } from "lucide-react";
import Logo from "@/components/Logo";
import Badge from "@/components/Badge";
import Link from "next/link";

// Sample cleaner dashboard data — no backend yet
const cleaner = {
  name: "Maria",
  avatar: "MG",
  todayInspections: 4,
  completedToday: 2,
  avgScore: 96,
};

const jobs = [
  {
    id: "1",
    address: "482 Maple Street",
    city: "Austin, TX",
    time: "10:30 AM",
    status: "next",
    rooms: 4,
  },
  {
    id: "2",
    address: "19 Oak Avenue",
    city: "Austin, TX",
    time: "1:00 PM",
    status: "upcoming",
    rooms: 3,
  },
  {
    id: "3",
    address: "330 Cedar Blvd",
    city: "Austin, TX",
    time: "3:30 PM",
    status: "upcoming",
    rooms: 2,
  },
  {
    id: "4",
    address: "7 Riverside Dr",
    city: "Austin, TX",
    time: "Completed",
    status: "done",
    rooms: 5,
    score: 97,
  },
  {
    id: "5",
    address: "55 Elm Court",
    city: "Austin, TX",
    time: "Completed",
    status: "done",
    rooms: 3,
    score: 93,
  },
];

export default function CleanerDashboard() {
  const nextJob = jobs.find((j) => j.status === "next");

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-4 flex items-center justify-between">
        <Logo size="sm" href="/cleaner/dashboard" />
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
          {cleaner.avatar}
        </div>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto">
        {/* Greeting */}
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Hey, {cleaner.name} 👋
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Monday, April 14 — You have {cleaner.todayInspections} jobs today.
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
            <p className="text-2xl font-bold text-[#0F172A]">
              {cleaner.completedToday}
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Done</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
            <p className="text-2xl font-bold text-[#0F172A]">
              {cleaner.todayInspections - cleaner.completedToday}
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Remaining</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 text-center">
            <p className="text-2xl font-bold text-[#0EA5E9]">
              {cleaner.avgScore}%
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Avg score</p>
          </div>
        </div>

        {/* Next job CTA */}
        {nextJob && (
          <Link href={`/cleaner/inspection/${nextJob.id}`}>
            <div className="mt-5 bg-gradient-to-r from-[#0EA5E9] to-[#6366F1] rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  Next Job
                </span>
                <Clock size={16} className="opacity-70" />
              </div>
              <p className="text-lg font-bold leading-snug">{nextJob.address}</p>
              <p className="text-sm opacity-80 mt-0.5">
                {nextJob.city} · {nextJob.rooms} rooms · {nextJob.time}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Start Checklist →
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Today's jobs list */}
        <h2 className="text-base font-semibold text-[#0F172A] mt-7 mb-3">
          Today&apos;s Schedule
        </h2>
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={
                job.status !== "done"
                  ? `/cleaner/inspection/${job.id}`
                  : "#"
              }
              className={`flex items-center gap-4 bg-white rounded-2xl border p-4 transition-all ${
                job.status === "next"
                  ? "border-[#0EA5E9] shadow-sm"
                  : "border-[#E2E8F0]"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  job.status === "done"
                    ? "bg-emerald-50"
                    : job.status === "next"
                      ? "bg-[#F0F9FF]"
                      : "bg-[#F1F5F9]"
                }`}
              >
                {job.status === "done" ? (
                  <CheckCircle2 size={20} className="text-emerald-500" />
                ) : (
                  <ClipboardList
                    size={20}
                    className={
                      job.status === "next" ? "text-[#0EA5E9]" : "text-[#94A3B8]"
                    }
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">
                  {job.address}
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {job.rooms} rooms ·{" "}
                  {job.status === "done" && job.score != null
                    ? `Score: ${job.score}%`
                    : job.time}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {job.status === "done" ? (
                  <Badge variant="success" dot>
                    done
                  </Badge>
                ) : job.status === "next" ? (
                  <Badge variant="info" dot>
                    next
                  </Badge>
                ) : (
                  <ChevronRight size={16} className="text-[#CBD5E1]" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
