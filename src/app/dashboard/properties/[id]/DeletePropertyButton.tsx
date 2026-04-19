"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import Button from "@/components/Button";
import { deleteProperty } from "@/actions/properties";

interface Props {
  id: string;
  name: string;
}

export default function DeletePropertyButton({ id, name }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProperty(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Property deleted.");
      setShowModal(false);
      router.push("/dashboard/properties");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="danger" size="md" onClick={() => setShowModal(true)}>
        <Trash2 size={15} />
        Delete
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-[#0F172A] mb-2">
              Delete property?
            </h3>
            <p className="text-sm text-[#64748B] mb-6">
              Delete {name}&apos;s property? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
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
