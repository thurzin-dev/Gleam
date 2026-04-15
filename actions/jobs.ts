"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Job, JobStatus, ActionResult } from "@/lib/types";

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data.org_id;
}

export async function listJobs(filters?: {
  status?: JobStatus;
  assigned_to?: string;
  property_id?: string;
}): Promise<ActionResult<Job[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  let query = supabase
    .from("jobs")
    .select("*")
    .eq("org_id", orgId)
    .order("scheduled_date", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.assigned_to) query = query.eq("assigned_to", filters.assigned_to);
  if (filters?.property_id) query = query.eq("property_id", filters.property_id);

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Job[] };
}

export async function getJob(id: string): Promise<ActionResult<Job>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Job };
}

export async function createJob(formData: FormData): Promise<ActionResult<Job>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const checklistTemplateId = formData.get("checklist_template_id") as string | null;
  const assignedTo = formData.get("assigned_to") as string | null;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      org_id: orgId,
      property_id: formData.get("property_id") as string,
      assigned_to: assignedTo || null,
      checklist_template_id: checklistTemplateId || null,
      status: "pending",
      scheduled_date: formData.get("scheduled_date") as string,
    })
    .select()
    .single();

  if (jobError || !job) return { success: false, error: jobError?.message ?? "Failed to create job" };

  // If a template was provided, seed job_items from it
  if (checklistTemplateId) {
    const { data: template } = await supabase
      .from("checklist_templates")
      .select("items")
      .eq("id", checklistTemplateId)
      .eq("org_id", orgId)
      .single();

    if (template?.items?.length) {
      const itemRows = template.items.map((item: { id: string; label: string }) => ({
        job_id: job.id,
        org_id: orgId,
        label: item.label,
        checked: false,
      }));

      await supabase.from("job_items").insert(itemRows);
    }
  }

  revalidatePath("/dashboard/jobs");
  return { success: true, data: job as Job };
}

export async function updateJobStatus(
  id: string,
  status: JobStatus
): Promise<ActionResult<Job>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${id}`);
  return { success: true, data: data as Job };
}

export async function deleteJob(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true, data: undefined };
}
