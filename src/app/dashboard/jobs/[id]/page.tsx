import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  CalendarClock,
  User,
  CheckCircle2,
  Circle,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Badge from "@/components/Badge";
import ProgressBar from "@/components/ProgressBar";
import {
  jobs,
  countProgress,
  statusLabel,
  statusVariant,
} from "@/lib/sampleData";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  const { done, total, pct } = countProgress(job.rooms);

  return (
    <>
      <OwnerTopbar title="Job detail" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-4"
          >
            <ArrowLeft size={14} />
            Back to jobs
          </Link>

          {/* Hero card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <Badge variant={statusVariant(job.status)} dot>
                  {statusLabel(job.status)}
                </Badge>
                <h2 className="text-2xl font-bold text-[#0F172A] mt-3">
                  {job.clientName}
                </h2>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-[#64748B]">
                  <MapPin size={14} />
                  {job.propertyAddress}
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <CalendarClock size={15} className="text-[#64748B]" />
                  {job.date} · {job.time}
                </div>
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <User size={15} className="text-[#64748B]" />
                  {job.cleanerName}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#0F172A]">
                  Checklist progress
                </p>
                <p className="text-sm text-[#64748B]">
                  {done} of {total} items · {pct}%
                </p>
              </div>
              <ProgressBar value={pct} height="md" />
            </div>
          </div>

          {/* Rooms */}
          <div className="flex flex-col gap-4">
            {job.rooms.map((room) => {
              const roomDone = room.items.filter((i) => i.done).length;
              return (
                <section
                  key={room.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
                >
                  <header className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
                    <h3 className="text-base font-semibold text-[#0F172A]">
                      {room.name}
                    </h3>
                    <span className="text-xs font-medium text-[#64748B]">
                      {roomDone} / {room.items.length} done
                    </span>
                  </header>

                  <ul className="divide-y divide-[#F1F5F9]">
                    {room.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-4 px-5 py-3"
                      >
                        {item.done ? (
                          <CheckCircle2
                            size={18}
                            className="text-emerald-500 flex-shrink-0"
                          />
                        ) : (
                          <Circle
                            size={18}
                            className="text-[#CBD5E1] flex-shrink-0"
                          />
                        )}
                        <span
                          className={`flex-1 text-sm ${
                            item.done
                              ? "text-[#0F172A]"
                              : "text-[#64748B]"
                          }`}
                        >
                          {item.label}
                        </span>

                        {item.photoUrl ? (
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#38BDF8]/15 to-[#6366F1]/15 border border-[#E2E8F0] flex items-center justify-center">
                              <ImageIcon
                                size={16}
                                className="text-[#6366F1]"
                              />
                            </div>
                            <span className="text-xs text-[#64748B] hidden sm:inline">
                              Photo
                            </span>
                          </div>
                        ) : item.done ? (
                          <span className="text-xs text-[#94A3B8]">
                            No photo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#94A3B8]">
                            <Camera size={13} />
                            Pending
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
