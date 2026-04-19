"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ChecklistItem = { id: string; label: string };
export type ChecklistRoom = { id: string; name: string; items: ChecklistItem[] };

export type Property = {
  id: string;
  name: string;
  address: string;
  checklist: ChecklistRoom[];
};

function parseChecklist(value: unknown): ChecklistRoom[] {
  if (!Array.isArray(value)) return [];
  return value.map((room, ri) => {
    const r = room as Partial<ChecklistRoom> & { items?: unknown };
    const items = Array.isArray(r.items)
      ? r.items.map((it, ii) => {
          const item = it as Partial<ChecklistItem>;
          return {
            id: typeof item.id === "string" && item.id ? item.id : `r${ri}-i${ii}`,
            label: typeof item.label === "string" ? item.label : "",
          };
        })
      : [];
    return {
      id: typeof r.id === "string" && r.id ? r.id : `r${ri}`,
      name: typeof r.name === "string" ? r.name : "",
      items,
    };
  });
}

type RequireOwnerResult =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      orgId: string;
    };

async function requireOwner(): Promise<RequireOwnerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) return { ok: false, error: "Profile not found" };
  if (profile.role !== "owner") {
    return { ok: false, error: "Only owners can manage properties" };
  }

  return { ok: true, supabase, orgId: profile.org_id as string };
}

export async function listProperties(): Promise<ActionResult<Property[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("properties")
    .select("id, name, address, checklist")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  const properties: Property[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    checklist: parseChecklist(p.checklist),
  }));

  return { success: true, data: properties };
}

export async function getProperty(id: string): Promise<ActionResult<Property>> {
  if (!id) return { success: false, error: "Missing property id" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("properties")
    .select("id, name, address, checklist")
    .eq("id", id)
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: "Property not found" };

  return {
    success: true,
    data: {
      id: data.id,
      name: data.name,
      address: data.address,
      checklist: parseChecklist(data.checklist),
    },
  };
}

type PropertyInput = {
  name: string;
  address: string;
  checklist: ChecklistRoom[];
};

function validateInput(input: PropertyInput): string | null {
  if (!input.name?.trim()) return "Client name is required";
  if (!input.address?.trim()) return "Address is required";
  if (!Array.isArray(input.checklist) || input.checklist.length === 0) {
    return "Add at least one room with checklist items";
  }
  for (const room of input.checklist) {
    if (!room.name?.trim()) return "Every room needs a name";
    if (!Array.isArray(room.items) || room.items.length === 0) {
      return `"${room.name}" has no checklist items`;
    }
  }
  return null;
}

export async function createProperty(
  input: PropertyInput
): Promise<ActionResult<{ id: string }>> {
  const validationError = validateInput(input);
  if (validationError) return { success: false, error: validationError };

  const auth = await requireOwner();
  if (!auth.ok) return { success: false, error: auth.error };

  const { data, error } = await auth.supabase
    .from("properties")
    .insert({
      org_id: auth.orgId,
      name: input.name.trim(),
      address: input.address.trim(),
      checklist: input.checklist,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to create property" };
  }

  revalidatePath("/dashboard/properties");
  return { success: true, data: { id: data.id } };
}

export async function updateProperty(
  id: string,
  input: PropertyInput
): Promise<ActionResult> {
  if (!id) return { success: false, error: "Missing property id" };
  const validationError = validateInput(input);
  if (validationError) return { success: false, error: validationError };

  const auth = await requireOwner();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase
    .from("properties")
    .update({
      name: input.name.trim(),
      address: input.address.trim(),
      checklist: input.checklist,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
  return { success: true, data: undefined };
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  if (!id) return { success: false, error: "Missing property id" };

  const auth = await requireOwner();
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await auth.supabase.from("properties").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/properties");
  return { success: true, data: undefined };
}
