import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import {
  ClipboardCheck,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Star,
} from "lucide-react";
import Link from "next/link";

// Sample data — no backend yet
const stats = [
  {
    label: "Inspections Today",
    value: "12",
    change: "+3 from yesterday",
    icon: ClipboardCheck,
    color: "text-[#0EA5E9]",
    bg: "bg-[#F0F9FF]",
  },
  {
    label: "Active Cleaners",
    value: "8",
    change: "2 on shift now",
    icon: Users,
    color: "text-[#6366F1]",
    bg: "bg-[#F5F3FF]",
  },
  {
    label: "Avg Score This Week",
    value: "94%",
    change: "+2.1% vs last week",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Open Issues",
    value: "3",
    change: "Needs attention",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const recentInspections = [
  {
    id: "1",
    address: "482 Maple Street, Austin TX",
    cleaner: "Maria G.",
    score: 97,
    status: "passed",
    time: "10 min ago",
  },
  {
    id: "2",
    address: "19 Oak Avenue, Austin TX",
    cleaner: "James T.",
    score: 88,
    status: "passed",
    time: "42 min ago",
  },
  {
    id: "3",
    address: "7 Riverside Dr, Austin TX",
    cleaner: "Sofia M.",
    score: 71,
    status: "failed",
    time: "1 hr ago",
  },
  {
    id: "4",
    address: "330 Cedar Blvd, Austin TX",
    cleaner: "Marcus L.",
    score: 100,
    status: "passed",
    time: "2 hr ago",
  },
  {
    id: "5",
    address: "55 Elm Court, Austin TX",
    cleaner: "Ana P.",
    score: 82,
    status: "passed",
    time: "3 hr ago",
  },
];

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90
      ? "bg-emerald-400"
      : score >= 75
        ? "bg-amber-400"
        : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-[#0F172A] w-10 text-right">
        {score}%
      </span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <OwnerTopbar title="Dashboard" />
      <div className="flex-1 px-4 lg:px-8 py-8 max-w-6xl w-full mx-auto">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#0F172A]">
            Good morning, Sarah 👋
          </h2>
          <p className="text-[#64748B] mt-1 text-sm">
            Monday, April 14 — Here&apos;s how your team is doing today.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, change, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#64748B]">
                  {label}
                </span>
                <div className={`${bg} p-2 rounded-xl`}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#0F172A]">{value}</p>
              <p className="text-xs text-[#94A3B8]">{change}</p>
            </div>
          ))}
        </div>

        {/* Recent inspections */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="font-semibold text-[#0F172A]">
              Recent Inspections
            </h3>
            <Link
              href="/inspections"
              className="text-sm text-[#0EA5E9] font-medium hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {recentInspections.map((item) => (
              <Link
                key={item.id}
                href={`/inspections/${item.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
              >
                {/* Score icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.score === 100
                      ? "bg-amber-50"
                      : item.score >= 90
                        ? "bg-emerald-50"
                        : item.score >= 75
                          ? "bg-amber-50"
                          : "bg-red-50"
                  }`}
                >
                  {item.score === 100 ? (
                    <Star size={16} className="text-amber-500" />
                  ) : (
                    <ClipboardCheck
                      size={16}
                      className={
                        item.score >= 90
                          ? "text-emerald-500"
                          : item.score >= 75
                            ? "text-amber-500"
                            : "text-red-500"
                      }
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">
                    {item.address}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {item.cleaner} · {item.time}
                  </p>
                </div>

                <div className="w-32 hidden sm:block">
                  <ScoreBar score={item.score} />
                </div>

                <Badge
                  variant={item.status === "passed" ? "success" : "danger"}
                  dot
                >
                  {item.status}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
