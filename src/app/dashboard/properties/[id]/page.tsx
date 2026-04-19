import Link from "next/link";
import { ArrowLeft, MapPin, Pencil, CheckCircle2, Home as HomeIcon } from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import { getProperty } from "@/actions/properties";
import DeletePropertyButton from "./DeletePropertyButton";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProperty(id);

  if (!result.success) {
    return (
      <>
        <OwnerTopbar title="Property" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-[#64748B] mb-4">{result.error}</p>
            <Link
              href="/dashboard/properties"
              className="text-sm text-[#0EA5E9] hover:underline"
            >
              Back to properties
            </Link>
          </div>
        </div>
      </>
    );
  }

  const property = result.data;
  const totalItems = property.checklist.reduce((a, r) => a + r.items.length, 0);

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

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#38BDF8]/15 to-[#0EA5E9]/10 flex items-center justify-center flex-shrink-0">
                  <HomeIcon size={22} className="text-[#0EA5E9]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A]">
                    {property.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-[#64748B]">
                    <MapPin size={14} />
                    {property.address}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-2">
                    {property.checklist.length} rooms · {totalItems} checklist items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/properties/${property.id}/edit`}>
                  <Button variant="ghost" size="md">
                    <Pencil size={15} />
                    Edit
                  </Button>
                </Link>
                <DeletePropertyButton id={property.id} name={property.name} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {property.checklist.map((room) => (
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
                      <span className="text-sm text-[#0F172A]">{item.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
