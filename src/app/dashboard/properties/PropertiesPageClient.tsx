"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, MapPin, Pencil, Trash2, Home } from "lucide-react";
import Button from "@/components/Button";
import { deleteProperty, type Property } from "@/actions/properties";

interface Props {
  properties: Property[];
}

export default function PropertiesPageClient({ properties }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteProperty(target.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${target.name}'s property deleted.`);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Properties</h2>
              <p className="text-sm text-[#64748B] mt-1">
                {properties.length} {properties.length === 1 ? "property" : "properties"}
              </p>
            </div>
            <Link href="/dashboard/properties/new">
              <Button variant="primary" size="md">
                <Plus size={16} />
                Add Property
              </Button>
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] py-16 text-center text-sm text-[#64748B]">
              No properties yet. Add your first property to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {properties.map((property) => {
                const totalItems = property.checklist.reduce(
                  (a, r) => a + r.items.length,
                  0
                );
                return (
                  <div
                    key={property.id}
                    className="group bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-sm hover:border-[#CBD5E1]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38BDF8]/15 to-[#0EA5E9]/10 flex items-center justify-center">
                        <Home size={18} className="text-[#0EA5E9]" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Link
                          href={`/dashboard/properties/${property.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0EA5E9]"
                          aria-label="Edit property"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              id: property.id,
                              name: property.name,
                            })
                          }
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500"
                          aria-label="Delete property"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-[#0F172A]">
                      {property.name}
                    </h3>
                    <div className="flex items-start gap-1.5 mt-1 text-sm text-[#64748B]">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span>{property.address}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
                      <span>
                        {property.checklist.length} rooms · {totalItems} checks
                      </span>
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="text-[#0EA5E9] font-medium hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">
              Delete property?
            </h3>
            <p className="text-sm text-[#64748B] mb-6">
              Delete {deleteTarget.name}&apos;s property? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={pending}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
