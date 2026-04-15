"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Camera,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/Button";

// Sample inspection checklist — no backend yet
const inspection = {
  id: "1",
  address: "482 Maple Street",
  city: "Austin, TX",
  rooms: [
    {
      id: "kitchen",
      name: "Kitchen",
      items: [
        { id: "k1", label: "Wipe all countertops" },
        { id: "k2", label: "Scrub sink and faucets" },
        { id: "k3", label: "Clean stovetop" },
        { id: "k4", label: "Wipe down appliances (microwave, toaster)" },
        { id: "k5", label: "Mop floor" },
        { id: "k6", label: "Empty trash" },
      ],
    },
    {
      id: "master-bed",
      name: "Master Bedroom",
      items: [
        { id: "mb1", label: "Make bed with hospital corners" },
        { id: "mb2", label: "Dust all surfaces" },
        { id: "mb3", label: "Vacuum floor and under bed" },
        { id: "mb4", label: "Clean mirrors streak-free" },
        { id: "mb5", label: "Organize nightstands" },
      ],
    },
    {
      id: "master-bath",
      name: "Master Bathroom",
      items: [
        { id: "bat1", label: "Scrub toilet (inside & outside)" },
        { id: "bat2", label: "Clean shower/tub" },
        { id: "bat3", label: "Wipe vanity and mirror" },
        { id: "bat4", label: "Mop floor" },
        { id: "bat5", label: "Restock toilet paper" },
      ],
    },
    {
      id: "living",
      name: "Living Room",
      items: [
        { id: "lr1", label: "Dust furniture and shelves" },
        { id: "lr2", label: "Fluff and arrange cushions" },
        { id: "lr3", label: "Vacuum carpet/rugs" },
        { id: "lr4", label: "Clean windows and sills" },
        { id: "lr5", label: "Wipe light switches and door handles" },
      ],
    },
  ],
};

export default function CleanerInspectionPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set([inspection.rooms[0].id])
  );
  const [submitting, setSubmitting] = useState(false);

  const totalItems = inspection.rooms.reduce(
    (acc, r) => acc + r.items.length,
    0
  );
  const progress = Math.round((checked.size / totalItems) * 100);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRoom(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function roomProgress(room: (typeof inspection.rooms)[0]) {
    const done = room.items.filter((i) => checked.has(i.id)).length;
    return { done, total: room.items.length };
  }

  function handleSubmit() {
    if (progress < 100) {
      toast.error("Complete all checklist items first.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Inspection submitted!");
    }, 1400);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3">
        <Link
          href="/cleaner/dashboard"
          className="p-2 -ml-1 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0F172A] truncate">
            {inspection.address}
          </p>
          <p className="text-xs text-[#94A3B8]">{inspection.city}</p>
        </div>
        <span className="text-sm font-bold text-[#0EA5E9]">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#E2E8F0]">
        <div
          className="h-full bg-gradient-to-r from-[#38BDF8] to-[#6366F1] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto">
        {/* Rooms */}
        <div className="flex flex-col gap-3">
          {inspection.rooms.map((room) => {
            const { done, total } = roomProgress(room);
            const open = expanded.has(room.id);
            const complete = done === total;

            return (
              <div
                key={room.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  complete ? "border-emerald-200" : "border-[#E2E8F0]"
                }`}
              >
                {/* Room header — big tap target */}
                <button
                  onClick={() => toggleRoom(room.id)}
                  className="w-full flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    {complete ? (
                      <CheckCircle2
                        size={20}
                        className="text-emerald-500 flex-shrink-0"
                      />
                    ) : (
                      <Circle
                        size={20}
                        className="text-[#CBD5E1] flex-shrink-0"
                      />
                    )}
                    <div className="text-left">
                      <p className="text-base font-semibold text-[#0F172A]">
                        {room.name}
                      </p>
                      <p className="text-xs text-[#94A3B8]">
                        {done} / {total} done
                      </p>
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp size={18} className="text-[#94A3B8]" />
                  ) : (
                    <ChevronDown size={18} className="text-[#94A3B8]" />
                  )}
                </button>

                {/* Checklist items */}
                {open && (
                  <div className="border-t border-[#F1F5F9]">
                    {room.items.map((item) => {
                      const done = checked.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggle(item.id)}
                          // Large tap target — cleaners use with wet/gloved hands
                          className={`w-full flex items-center gap-4 px-5 py-4 border-b border-[#F1F5F9] last:border-0 transition-colors active:bg-[#F0F9FF]
                            ${done ? "bg-[#F0FDF4]" : "bg-white"}`}
                        >
                          {done ? (
                            <CheckCircle2
                              size={24}
                              className="text-emerald-500 flex-shrink-0"
                            />
                          ) : (
                            <Circle
                              size={24}
                              className="text-[#CBD5E1] flex-shrink-0"
                            />
                          )}
                          <span
                            className={`text-base text-left ${
                              done
                                ? "line-through text-[#94A3B8]"
                                : "text-[#0F172A]"
                            }`}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    })}

                    {/* Add photo button per room */}
                    <button className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-[#94A3B8] hover:text-[#64748B] border-t border-[#F1F5F9] transition-colors">
                      <Camera size={18} />
                      Add a photo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed bottom submit button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-4 py-4 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto">
          <Button
            fullWidth
            size="lg"
            variant={progress === 100 ? "primary" : "ghost"}
            loading={submitting}
            onClick={handleSubmit}
          >
            <Send size={18} />
            {progress === 100
              ? "Submit Inspection"
              : `${totalItems - checked.size} items remaining`}
          </Button>
        </div>
      </div>
    </div>
  );
}
