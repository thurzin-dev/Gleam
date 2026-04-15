import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Star,
  Camera,
} from "lucide-react";
import Link from "next/link";

// Sample inspection detail — no backend yet
const inspection = {
  id: "1",
  address: "482 Maple Street, Austin TX 78701",
  cleaner: "Maria G.",
  date: "April 14, 2026",
  time: "9:12 AM",
  score: 97,
  status: "passed",
  duration: "1h 24min",
  rooms: [
    {
      name: "Kitchen",
      score: 100,
      items: [
        { label: "Countertops wiped", passed: true },
        { label: "Sink scrubbed", passed: true },
        { label: "Appliances cleaned", passed: true },
        { label: "Floor mopped", passed: true },
      ],
    },
    {
      name: "Master Bedroom",
      score: 95,
      items: [
        { label: "Bed made with hospital corners", passed: true },
        { label: "Dusting completed", passed: true },
        { label: "Vacuuming done", passed: true },
        { label: "Mirrors streak-free", passed: false },
      ],
    },
    {
      name: "Master Bathroom",
      score: 90,
      items: [
        { label: "Toilet scrubbed", passed: true },
        { label: "Shower/tub cleaned", passed: true },
        { label: "Tiles grout checked", passed: false },
        { label: "Vanity organized", passed: true },
      ],
    },
    {
      name: "Living Room",
      score: 100,
      items: [
        { label: "Furniture dusted", passed: true },
        { label: "Cushions fluffed", passed: true },
        { label: "Vacuuming done", passed: true },
        { label: "Windows cleaned", passed: true },
      ],
    },
  ],
};

function RoomCard({
  room,
}: {
  room: (typeof inspection.rooms)[0];
}) {
  const color =
    room.score === 100
      ? "text-amber-600 bg-amber-50 border-amber-100"
      : room.score >= 90
        ? "text-emerald-700 bg-emerald-50 border-emerald-100"
        : room.score >= 75
          ? "text-amber-700 bg-amber-50 border-amber-100"
          : "text-red-700 bg-red-50 border-red-100";

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <h4 className="font-semibold text-[#0F172A]">{room.name}</h4>
        <span
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold border ${color}`}
        >
          {room.score === 100 && <Star size={12} />}
          {room.score}%
        </span>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {room.items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            {item.passed ? (
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle size={16} className="text-red-400 flex-shrink-0" />
            )}
            <span
              className={`text-sm ${item.passed ? "text-[#0F172A]" : "text-red-600"}`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InspectionDetailPage() {
  const overallColor =
    inspection.score >= 90 ? "text-emerald-600" : inspection.score >= 75 ? "text-amber-600" : "text-red-600";

  return (
    <>
      <OwnerTopbar title="Inspection Detail" />
      <div className="flex-1 px-4 lg:px-8 py-8 max-w-4xl w-full mx-auto">
        {/* Back link */}
        <Link
          href="/inspections"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Inspections
        </Link>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-[#94A3B8] mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    {inspection.address}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <User size={14} />
                  {inspection.cleaner}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {inspection.date} at {inspection.time}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={inspection.status === "passed" ? "success" : "danger"} dot>
                  {inspection.status}
                </Badge>
                <span className="text-xs text-[#94A3B8]">
                  Duration: {inspection.duration}
                </span>
              </div>
            </div>

            {/* Score circle */}
            <div className="flex flex-col items-center bg-[#F8FAFC] rounded-2xl px-8 py-5 border border-[#E2E8F0] flex-shrink-0">
              <span className={`text-4xl font-black ${overallColor}`}>
                {inspection.score}%
              </span>
              <span className="text-xs text-[#94A3B8] mt-1">Overall score</span>
            </div>
          </div>
        </div>

        {/* Photo placeholder */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-[#0F172A]">Photos</h3>
            <span className="text-xs text-[#94A3B8]">4 photos</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-[#F1F5F9] flex flex-col items-center justify-center gap-1.5 border border-[#E2E8F0]"
              >
                <Camera size={20} className="text-[#94A3B8]" />
                <span className="text-xs text-[#CBD5E1]">Photo {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Room-by-room */}
        <h3 className="font-semibold text-[#0F172A] mb-4">
          Room Breakdown
        </h3>
        <div className="flex flex-col gap-4">
          {inspection.rooms.map((room) => (
            <RoomCard key={room.name} room={room} />
          ))}
        </div>
      </div>
    </>
  );
}
