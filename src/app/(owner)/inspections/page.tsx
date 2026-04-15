import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import { ClipboardCheck, Filter, Search, Star } from "lucide-react";
import Link from "next/link";

// Sample inspections — no backend yet
const inspections = [
  {
    id: "1",
    address: "482 Maple Street, Austin TX",
    cleaner: "Maria G.",
    score: 97,
    status: "passed",
    rooms: 4,
    date: "Apr 14, 2026",
    time: "9:12 AM",
  },
  {
    id: "2",
    address: "19 Oak Avenue, Austin TX",
    cleaner: "James T.",
    score: 88,
    status: "passed",
    rooms: 3,
    date: "Apr 14, 2026",
    time: "9:55 AM",
  },
  {
    id: "3",
    address: "7 Riverside Dr, Austin TX",
    cleaner: "Sofia M.",
    score: 71,
    status: "failed",
    rooms: 5,
    date: "Apr 14, 2026",
    time: "10:38 AM",
  },
  {
    id: "4",
    address: "330 Cedar Blvd, Austin TX",
    cleaner: "Marcus L.",
    score: 100,
    status: "passed",
    rooms: 2,
    date: "Apr 13, 2026",
    time: "2:05 PM",
  },
  {
    id: "5",
    address: "55 Elm Court, Austin TX",
    cleaner: "Ana P.",
    score: 82,
    status: "passed",
    rooms: 3,
    date: "Apr 13, 2026",
    time: "3:47 PM",
  },
  {
    id: "6",
    address: "900 Spruce Lane, Austin TX",
    cleaner: "Maria G.",
    score: 95,
    status: "passed",
    rooms: 4,
    date: "Apr 12, 2026",
    time: "11:20 AM",
  },
  {
    id: "7",
    address: "212 Birch Road, Austin TX",
    cleaner: "James T.",
    score: 63,
    status: "failed",
    rooms: 6,
    date: "Apr 12, 2026",
    time: "1:00 PM",
  },
];

function ScoreChip({ score }: { score: number }) {
  const color =
    score === 100
      ? "text-amber-600 bg-amber-50"
      : score >= 90
        ? "text-emerald-700 bg-emerald-50"
        : score >= 75
          ? "text-amber-700 bg-amber-50"
          : "text-red-700 bg-red-50";

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold ${color}`}>
      {score === 100 && <Star size={12} />}
      {score}%
    </span>
  );
}

export default function InspectionsPage() {
  return (
    <>
      <OwnerTopbar title="Inspections" />
      <div className="flex-1 px-4 lg:px-8 py-8 max-w-6xl w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A]">Inspections</h2>
            <p className="text-sm text-[#64748B] mt-0.5">
              {inspections.length} inspections total
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                placeholder="Search address or cleaner…"
                className="pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E2E8F0] bg-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8] w-64 placeholder:text-[#94A3B8]"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
              <Filter size={15} />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-left">
                <th className="px-6 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Cleaner
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {inspections.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#F0F9FF] flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck size={15} className="text-[#0EA5E9]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#0F172A]">
                          {item.address}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {item.rooms} rooms
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">{item.cleaner}</td>
                  <td className="px-6 py-4">
                    <ScoreChip score={item.score} />
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={item.status === "passed" ? "success" : "danger"}
                      dot
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-[#94A3B8] text-xs">
                    <p>{item.date}</p>
                    <p>{item.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/inspections/${item.id}`}
                      className="text-[#0EA5E9] text-xs font-medium hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-[#F1F5F9]">
            {inspections.map((item) => (
              <Link
                key={item.id}
                href={`/inspections/${item.id}`}
                className="flex items-center gap-3 px-4 py-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck size={18} className="text-[#0EA5E9]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A] truncate">
                    {item.address}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {item.cleaner} · {item.date}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ScoreChip score={item.score} />
                  <Badge
                    variant={item.status === "passed" ? "success" : "danger"}
                    dot
                  >
                    {item.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
