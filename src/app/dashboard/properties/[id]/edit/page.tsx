import Link from "next/link";
import OwnerTopbar from "@/components/OwnerTopbar";
import { getProperty } from "@/actions/properties";
import EditPropertyClient from "./EditPropertyClient";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProperty(id);

  if (!result.success) {
    return (
      <>
        <OwnerTopbar title="Edit property" />
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

  return (
    <>
      <OwnerTopbar title="Edit property" />
      <EditPropertyClient property={result.data} />
    </>
  );
}
