"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Home as HomeIcon,
} from "lucide-react";
import OwnerTopbar from "@/components/OwnerTopbar";
import Button from "@/components/Button";
import Input from "@/components/Input";

interface DraftItem {
  id: string;
  label: string;
}

interface DraftRoom {
  id: string;
  name: string;
  items: DraftItem[];
  draftItem: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [rooms, setRooms] = useState<DraftRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [saving, setSaving] = useState(false);

  function addRoom() {
    if (!newRoomName.trim()) {
      toast.error("Give the room a name first.");
      return;
    }
    setRooms((prev) => [
      ...prev,
      { id: uid(), name: newRoomName.trim(), items: [], draftItem: "" },
    ]);
    setNewRoomName("");
  }

  function removeRoom(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRoomDraft(id: string, value: string) {
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, draftItem: value } : r))
    );
  }

  function addItem(roomId: string) {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const label = r.draftItem.trim();
        if (!label) return r;
        return {
          ...r,
          items: [...r.items, { id: uid(), label }],
          draftItem: "",
        };
      })
    );
  }

  function removeItem(roomId: string, itemId: string) {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, items: r.items.filter((i) => i.id !== itemId) }
          : r
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !address.trim()) {
      toast.error("Client name and address are required.");
      return;
    }
    if (rooms.length === 0) {
      toast.error("Add at least one room with checklist items.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Property saved.");
      router.push("/dashboard/properties");
    }, 800);
  }

  const totalItems = rooms.reduce((a, r) => a + r.items.length, 0);

  return (
    <>
      <OwnerTopbar title="New property" />

      <div className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-4"
          >
            <ArrowLeft size={14} />
            Back to properties
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0F172A]">Add a property</h2>
            <p className="text-sm text-[#64748B] mt-1">
              Define the home and build the checklist room by room.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Property info */}
            <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-center gap-2 mb-5">
                <HomeIcon size={16} className="text-[#0EA5E9]" />
                <h3 className="text-sm font-semibold text-[#0F172A]">
                  Property details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Client name"
                  placeholder="e.g. Thompson Family"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
                <Input
                  label="Address"
                  placeholder="1248 Maple Ridge Dr, Austin, TX"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </section>

            {/* Rooms + checklist */}
            <section className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    Checklist by room
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {rooms.length} rooms · {totalItems} items total
                  </p>
                </div>
              </div>

              {/* Add-room row */}
              <div className="flex gap-2 mb-5">
                <input
                  type="text"
                  placeholder="Room name (e.g. Kitchen)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRoom();
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
                <Button type="button" variant="secondary" onClick={addRoom}>
                  <Plus size={15} />
                  Add room
                </Button>
              </div>

              {rooms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E2E8F0] py-10 text-center">
                  <p className="text-sm text-[#64748B]">
                    No rooms yet. Add your first room above.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {room.name}
                          <span className="ml-2 text-xs font-medium text-[#64748B]">
                            {room.items.length} items
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => removeRoom(room.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500"
                          aria-label="Remove room"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <ul className="divide-y divide-[#F1F5F9]">
                        {room.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between px-4 py-2.5 text-sm"
                          >
                            <span className="flex items-center gap-2 text-[#0F172A]">
                              <CheckCircle2
                                size={15}
                                className="text-[#94A3B8]"
                              />
                              {item.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(room.id, item.id)}
                              className="text-[#94A3B8] hover:text-red-500"
                              aria-label="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </li>
                        ))}
                      </ul>

                      <div className="flex gap-2 p-3 bg-white rounded-b-xl">
                        <input
                          type="text"
                          placeholder="Add checklist item"
                          value={room.draftItem}
                          onChange={(e) =>
                            updateRoomDraft(room.id, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addItem(room.id);
                            }
                          }}
                          className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addItem(room.id)}
                        >
                          <Plus size={14} />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex items-center justify-end gap-3">
              <Link href="/dashboard/properties">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={saving}>
                Save property
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
