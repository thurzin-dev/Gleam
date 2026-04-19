import OwnerTopbar from "@/components/OwnerTopbar";
import { listProperties } from "@/actions/properties";
import PropertiesPageClient from "./PropertiesPageClient";

export default async function PropertiesPage() {
  const result = await listProperties();

  if (!result.success) {
    return (
      <>
        <OwnerTopbar title="Properties" subtitle="All client homes and units" />
        <div className="flex-1 flex items-center justify-center text-sm text-[#64748B]">
          {result.error}
        </div>
      </>
    );
  }

  return (
    <>
      <OwnerTopbar title="Properties" subtitle="All client homes and units" />
      <PropertiesPageClient properties={result.data} />
    </>
  );
}
