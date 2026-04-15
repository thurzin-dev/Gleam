"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MapPin,
  ChevronDown,
  Camera,
  Check,
  PartyPopper,
} from "lucide-react";
import Button from "@/components/Button";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";
import {
  jobs as seedJobs,
  statusLabel,
  statusVariant,
  Room,
  ChecklistItem,
  JobStatus,
} from "@/lib/sampleData";

type WorkingRoom = Room;

export default function CleanerJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const seed = useMemo(() => seedJobs.find((j) => j.id === id), [id]);

  const [rooms, setRooms] = useState<WorkingRoom[]>(
    () => seed?.rooms.map((r) => ({ ...r, items: r.items.map((i) => ({ ...i })) })) ?? []
  );
  const [status, setStatus] = useState<JobStatus>(seed?.status ?? "not_started");
  const [openRoom, setOpenRoom] = useState<string | null>(
    seed?.rooms.find((r) => r.items.some((i) => !i.done))?.id ?? null
  );

  if (!seed) {
    return (
      <div className="p-8 text-center text-sm text-[#64748B]">
        Job not found.{" "}
        <Link href="/app" className="text-[#0EA5E9]">
          Back home
        </Link>
      </div>
    );
  }

  const total = rooms.reduce((a, r) => a + r.items.length, 0);
  const done = rooms.reduce(
    (a, r) => a + r.items.filter((i) => i.done).length,
    0
  );
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = done === total && total > 0;

  function toggleItem(roomId: string, itemId: string) {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              items: r.items.map((i) =>
                i.id === itemId ? { ...i, done: !i.done } : i
              ),
            }
          : r
      )
    );
    if (status === "not_started") setStatus("in_progress");
  }

  function takePhoto(roomId: string, item: ChecklistItem) {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              items: r.items.map((i) =>
                i.id === item.id
                  ? { ...i, photoUrl: "/placeholder-photo.svg", done: true }
                  : i
              ),
            }
          : r
      )
    );
    if (status === "not_started") setStatus("in_progress");
    toast.success("Photo captured!");
  }

  function startJob() {
    setStatus("in_progress");
    toast.success("Job started. Good luck!");
  }

  function completeJob() {
    setStatus("completed");
    toast.success("Job completed! Great work.");
    setTimeout(() => router.push("/app"), 1200);
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] px-5 py-4">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] mb-2"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#0F172A] leading-tight">
              {seed.clientName}
            </h1>
            <div className="flex items-start gap-1.5 mt-0.5 text-sm text-[#64748B]">
              <MapPin size={13} className="mt-0.5 flex-shrink-0" />
              <span>{seed.propertyAddress}</span>
            </div>
          </div>
          <Badge variant={statusVariant(status)} dot>
            {statusLabel(status)}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#64748B]">
              {done} of {total} items done
            </span>
            <span className="font-semibold text-[#0F172A]">{pct}%</span>
          </div>
          <ProgressBar value={pct} height="md" color={allDone ? "success" : "primary"} />
        </div>
      </header>

      <div className="flex-1 px-5 py-5">
        {status === "not_started" && (
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={startJob}
            className="mb-5"
          >
            Start Job
          </Button>
        )}

        <div className="flex flex-col gap-3">
          {rooms.map((room) => {
            const roomDone = room.items.filter((i) => i.done).length;
            const roomTotal = room.items.length;
            const roomPct = Math.round((roomDone / roomTotal) * 100);
            const isOpen = openRoom === room.id;
            const roomComplete = roomDone === roomTotal;

            return (
              <section
                key={room.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenRoom(isOpen ? null : room.id)}
                  className="w-full flex items-center justify-between px-5 py-4 active:bg-[#F8FAFC]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        roomComplete
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-[#F0F9FF] text-[#0EA5E9]"
                      }`}
                    >
                      {roomComplete ? (
                        <Check size={18} />
                      ) : (
                        <span className="text-sm font-bold">
                          {roomDone}/{roomTotal}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-base font-semibold text-[#0F172A]">
                        {room.name}
                      </p>
                      <p className="text-xs text-[#64748B]">{roomPct}% done</p>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-[#94A3B8] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <ul className="border-t border-[#F1F5F9] divide-y divide-[#F1F5F9]">
                    {room.items.map((item) => (
                      <li
                        key={item.id}
                        className="px-5 py-4 flex flex-col gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(room.id, item.id)}
                          className="flex items-start gap-3 text-left"
                        >
                          <span
                            className={`w-7 h-7 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              item.done
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-[#CBD5E1] bg-white"
                            }`}
                          >
                            {item.done && <Check size={16} strokeWidth={3} />}
                          </span>
                          <span
                            className={`text-base pt-0.5 ${
                              item.done
                                ? "text-[#94A3B8] line-through"
                                : "text-[#0F172A]"
                            }`}
                          >
                            {item.label}
                          </span>
                        </button>

                        <div className="flex items-center gap-3 pl-10">
                          {item.photoUrl ? (
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#38BDF8]/20 to-[#6366F1]/20 border border-[#E2E8F0] flex items-center justify-center">
                                <Camera size={18} className="text-[#6366F1]" />
                              </div>
                              <button
                                type="button"
                                onClick={() => takePhoto(room.id, item)}
                                className="text-sm text-[#0EA5E9] font-medium"
                              >
                                Retake
                              </button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="md"
                              onClick={() => takePhoto(room.id, item)}
                            >
                              <Camera size={16} />
                              Take Photo
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        {allDone && status !== "completed" && (
          <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex items-start gap-3">
            <PartyPopper
              size={22}
              className="text-emerald-500 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                All items checked!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Finish by marking this job as complete.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky complete CTA */}
      {allDone && status !== "completed" && (
        <div className="sticky bottom-0 px-5 py-4 bg-white border-t border-[#E2E8F0]">
          <Button
            fullWidth
            size="lg"
            variant="primary"
            onClick={completeJob}
          >
            <Check size={18} />
            Complete Job
          </Button>
        </div>
      )}
    </>
  );
}
