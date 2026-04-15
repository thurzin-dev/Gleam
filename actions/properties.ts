"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Property, ActionResult } from "@/lib/types";

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data.org_id;
}

export async function listProperties(): Promise<ActionResult<Property[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("org_id", orgId)
    .order("name");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Property[] };
}

export async function getProperty(
  id: string
): Promise<ActionResult<Property>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Property };
}

export async function createProperty(
  formData: FormData
): Promise<ActionResult<Property>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("properties")
    .insert({
      org_id: orgId,
      name: formData.get("name") as string,
      address: formData.get("address") as string,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/properties");
  return { success: true, data: data as Property };
}

export async function updateProperty(
  id: string,
  formData: FormData
): Promise<ActionResult<Property>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("properties")
    .update({
      name: formData.get("name") as string,
      address: formData.get("address") as string,
    })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/properties");
  return { success: true, data: data as Property };
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/properties");
  return { success: true, data: undefined };
}
