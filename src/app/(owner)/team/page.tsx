import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import Button from "@/components/Button";
import { UserPlus, MoreHorizontal, TrendingUp } from "lucide-react";
import Link from "next/link";

// Sample team data — no backend yet
const cleaners = [
  {
    id: "1",
    name: "Maria Garcia",
    email: "maria@cleanpro.com",
    avatar: "MG",
    avgScore: 96,
    inspections: 42,
    status: "active",
    joinedDate: "Jan 2026",
  },
  {
    id: "2",
    name: "James Thompson",
    email: "james@cleanpro.com",
    avatar: "JT",
    avgScore: 87,
    inspections: 38,
    status: "active",
    joinedDate: "Feb 2026",
  },
  {
    id: "3",
    name: "Sofia Martinez",
    email: "sofia@cleanpro.com",
    avatar: "SM",
    avgScore: 79,
    inspections: 29,
    status: "active",
    joinedDate: "Mar 2026",
  },
  {
    id: "4",
    name: "Marcus Lee",
    email: "marcus@cleanpro.com",
    avatar: "ML",
    avgScore: 99,
    inspections: 61,
    status: "active",
    joinedDate: "Dec 2025",
  },
  {
    id: "5",
    name: "Ana Pereira",
    email: "ana@cleanpro.com",
    avatar: "AP",
    avgScore: 91,
    inspections: 33,
    status: "active",
    joinedDate: "Mar 2026",
  },
  {
    id: "6",
    name: "David Chen",
    email: "david@cleanpro.com",
    avatar: "DC",
    avgScore: 0,
    inspections: 0,
    status: "invited",
    joinedDate: "—",
  },
];

const avatarColors = [
  "from-[#38BDF8] to-[#0EA5E9]",
  "from-[#818CF8] to-[#6366F1]",
  "from-[#34D399] to-[#059669]",
  "from-[#F59E0B] to-[#D97706]",
  "from-[#F472B6] to-[#DB2777]",
  "from-[#A78BFA] to-[#8B5CF6]",
];

export default function TeamPage() {
  return (
    <>
      <OwnerTopbar title="Team" />
      <div className="flex-1 px-4 lg:px-8 py-8 max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Team</h2>
            <p className="text-sm text-[#64748B] mt-0.5">
              {cleaners.filter((c) => c.status === "active").length} active cleaners
            </p>
          </div>
          <Link href="/team/invite">
            <Button variant="primary" size="md">
              <UserPlus size={16} />
              Invite Cleaner
            </Button>
          </Link>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3">
          {cleaners.map((cleaner, idx) => (
            <div
              key={cleaner.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
              >
                {cleaner.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {cleaner.name}
                  </p>
                  <Badge
                    variant={cleaner.status === "active" ? "success" : "warning"}
                    dot
                  >
                    {cleaner.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">{cleaner.email}</p>
              </div>

              {/* Stats (hidden on mobile) */}
              {cleaner.status === "active" && (
                <div className="hidden sm:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#0F172A]">
                      {cleaner.avgScore}%
                    </p>
                    <p className="text-xs text-[#94A3B8]">Avg score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#0F172A]">
                      {cleaner.inspections}
                    </p>
                    <p className="text-xs text-[#94A3B8]">Inspections</p>
                  </div>
                </div>
              )}

              {cleaner.status === "invited" && (
                <div className="hidden sm:block">
                  <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                    Pending invite
                  </span>
                </div>
              )}

              {/* Trend + actions */}
              <div className="flex items-center gap-2">
                {cleaner.status === "active" && (
                  <TrendingUp size={16} className="text-emerald-500 hidden sm:block" />
                )}
                <button className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#94A3B8] transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
