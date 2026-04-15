"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, MapPin, Pencil, Trash2, Home } from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import { properties } from "@/lib/sampleData";

export default function PropertiesPage() {
  function handleEdit(name: string) {
    toast.success(`Editing ${name} (demo).`);
  }

  function handleDelete(name: string) {
    toast(`Deleted ${name} (demo).`, { icon: "🗑️" });
  }

  return (
    <>
      <OwnerTopbar title="Properties" subtitle="All client homes and units" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0F172A]">Properties</h2>
              <p className="text-sm text-[#64748B] mt-1">
                {properties.length} properties across Austin
              </p>
            </div>
            <Link href="/dashboard/properties/new">
              <Button variant="primary" size="md">
                <Plus size={16} />
                Add Property
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="group bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-sm hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38BDF8]/15 to-[#0EA5E9]/10 flex items-center justify-center">
                    <Home size={18} className="text-[#0EA5E9]" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(property.clientName)}
                      className="p-1.5 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0EA5E9]"
                      aria-label="Edit property"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(property.clientName)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500"
                      aria-label="Delete property"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-[#0F172A]">
                  {property.clientName}
                </h3>
                <div className="flex items-start gap-1.5 mt-1 text-sm text-[#64748B]">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{property.address}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
                  <span>
                    {property.rooms.length} rooms ·{" "}
                    {property.rooms.reduce((a, r) => a + r.items.length, 0)} checks
                  </span>
                  <Link
                    href="#"
                    className="text-[#0EA5E9] font-medium hover:underline"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
