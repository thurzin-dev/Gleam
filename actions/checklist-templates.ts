"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistTemplate, ChecklistItem, ActionResult } from "@/lib/types";

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data.org_id;
}

export async function listChecklistTemplates(): Promise<
  ActionResult<ChecklistTemplate[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("org_id", orgId)
    .order("name");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as ChecklistTemplate[] };
}

export async function getChecklistTemplate(
  id: string
): Promise<ActionResult<ChecklistTemplate>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as ChecklistTemplate };
}

export async function createChecklistTemplate(
  name: string,
  items: ChecklistItem[]
): Promise<ActionResult<ChecklistTemplate>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("checklist_templates")
    .insert({ org_id: orgId, name, items })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true, data: data as ChecklistTemplate };
}

export async function updateChecklistTemplate(
  id: string,
  name: string,
  items: ChecklistItem[]
): Promise<ActionResult<ChecklistTemplate>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("checklist_templates")
    .update({ name, items })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true, data: data as ChecklistTemplate };
}

export async function deleteChecklistTemplate(
  id: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { error } = await supabase
    .from("checklist_templates")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/templates");
  return { success: true, data: undefined };
}
