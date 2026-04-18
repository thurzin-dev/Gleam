"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Trash2,
  CheckCircle2,
  Home as HomeIcon,
} from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import { properties } from "@/lib/sampleData";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const property = properties.find((p) => p.id === id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!property) {
    return (
      <>
        <OwnerTopbar title="Property" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-[#64748B] mb-4">Property not found.</p>
            <Link href="/dashboard/properties" className="text-sm text-[#0EA5E9] hover:underline">
              Back to properties
            </Link>
          </div>
        </div>
      </>
    );
  }

  function handleDelete() {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setShowDeleteModal(false);
      toast.success("Property deleted.");
      router.push("/dashboard/properties");
    }, 800);
  }

  const totalItems = property.rooms.reduce((a, r) => a + r.items.length, 0);

  return (
    <>
      <OwnerTopbar title="Property detail" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-4"
          >
            <ArrowLeft size={14} />
            Back to properties
          </Link>

          {/* Header card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#38BDF8]/15 to-[#0EA5E9]/10 flex items-center justify-center flex-shrink-0">
                  <HomeIcon size={22} className="text-[#0EA5E9]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    {property.clientName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-[#64748B]">
                    <MapPin size={14} />
                    {property.address}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-2">
                    {property.rooms.length} rooms · {totalItems} checklist items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/properties/${id}/edit`}>
                  <Button variant="ghost" size="md">
                    <Pencil size={15} />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={15} />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Rooms with checklists */}
          <div className="flex flex-col gap-4">
            {property.rooms.map((room) => (
              <section
                key={room.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden"
              >
                <header className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
                  <h3 className="text-base font-semibold text-[#0F172A]">
                    {room.name}
                  </h3>
                  <span className="text-xs font-medium text-[#64748B]">
                    {room.items.length} items
                  </span>
                </header>
                <ul className="divide-y divide-[#F1F5F9]">
                  {room.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <CheckCircle2
                        size={16}
                        className="text-[#94A3B8] flex-shrink-0"
                      />
                      <span className="text-sm text-[#0F172A]">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">
              Delete property?
            </h3>
            <p className="text-sm text-[#64748B] mb-6">
              Delete {property.clientName}&apos;s property? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
