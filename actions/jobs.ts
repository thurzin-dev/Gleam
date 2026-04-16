"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Job,
  JobItem,
  JobStatus,
  Property,
  Profile,
  PropertyRoom,
  ActionResult,
} from "@/lib/types";

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
  date_from?: string;
  date_to?: string;
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
  if (filters?.date_from) query = query.gte("scheduled_date", filters.date_from);
  if (filters?.date_to) query = query.lte("scheduled_date", filters.date_to);

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
  const propertyId = formData.get("property_id") as string;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      org_id: orgId,
      property_id: propertyId,
      assigned_to: assignedTo || null,
      checklist_template_id: checklistTemplateId || null,
      status: "pending",
      scheduled_date: formData.get("scheduled_date") as string,
    })
    .select()
    .single();

  if (jobError || !job) return { success: false, error: jobError?.message ?? "Failed to create job" };

  // Seed job_items from the property's per-room checklist.
  const { data: property } = await supabase
    .from("properties")
    .select("checklist")
    .eq("id", propertyId)
    .eq("org_id", orgId)
    .single();

  const rooms = (property?.checklist ?? []) as PropertyRoom[];
  const itemRows = rooms.flatMap((room) =>
    (room.items ?? []).map((item) => ({
      job_id: job.id,
      org_id: orgId,
      label: `${room.name} — ${item.label}`,
      checked: false,
    }))
  );

  if (itemRows.length) {
    await supabase.from("job_items").insert(itemRows);
  } else if (checklistTemplateId) {
    // Fallback: seed from legacy template if property has no checklist yet.
    const { data: template } = await supabase
      .from("checklist_templates")
      .select("items")
      .eq("id", checklistTemplateId)
      .eq("org_id", orgId)
      .single();

    if (template?.items?.length) {
      const templateRows = template.items.map((item: { id: string; label: string }) => ({
        job_id: job.id,
        org_id: orgId,
        label: item.label,
        checked: false,
      }));
      await supabase.from("job_items").insert(templateRows);
    }
  }

  revalidatePath("/dashboard/jobs");
  return { success: true, data: job as Job };
}

export async function getJobWithItems(id: string): Promise<
  ActionResult<{
    job: Job;
    property: Property | null;
    assignee: Profile | null;
    items: JobItem[];
  }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (jobError || !job) return { success: false, error: jobError?.message ?? "Job not found" };

  const [{ data: property }, { data: assignee }, { data: items, error: itemsError }] =
    await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("id", job.property_id)
        .eq("org_id", orgId)
        .single(),
      job.assigned_to
        ? supabase
            .from("profiles")
            .select("*")
            .eq("id", job.assigned_to)
            .eq("org_id", orgId)
            .single()
        : Promise.resolve({ data: null }),
      supabase
        .from("job_items")
        .select("*")
        .eq("job_id", id)
        .eq("org_id", orgId)
        .order("created_at"),
    ]);

  if (itemsError) return { success: false, error: itemsError.message };

  return {
    success: true,
    data: {
      job: job as Job,
      property: (property as Property) ?? null,
      assignee: (assignee as Profile) ?? null,
      items: (items ?? []) as JobItem[],
    },
  };
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
