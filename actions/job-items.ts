"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JobItem, ActionResult } from "@/lib/types";

async function getOrgId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data.org_id;
}

export async function listJobItems(
  jobId: string
): Promise<ActionResult<JobItem[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("job_items")
    .select("*")
    .eq("job_id", jobId)
    .eq("org_id", orgId)
    .order("created_at");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as JobItem[] };
}

export async function updateJobItem(
  id: string,
  updates: { checked?: boolean; notes?: string }
): Promise<ActionResult<JobItem>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data, error } = await supabase
    .from("job_items")
    .update(updates)
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const item = data as JobItem;
  revalidatePath(`/dashboard/jobs/${item.job_id}`);
  return { success: true, data: item };
}

export async function uploadJobItemPhoto(
  id: string,
  photo: File
): Promise<ActionResult<JobItem>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  // Verify the item belongs to this org before uploading
  const { data: existingItem, error: fetchError } = await supabase
    .from("job_items")
    .select("id, job_id")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (fetchError || !existingItem) {
    return { success: false, error: "Job item not found" };
  }

  const ext = photo.name.split(".").pop() ?? "jpg";
  const path = `${orgId}/${existingItem.job_id}/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(path, photo, { upsert: true });

  if (uploadError) return { success: false, error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("job-photos").getPublicUrl(path);

  const { data, error } = await supabase
    .from("job_items")
    .update({ photo_url: publicUrl })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const item = data as JobItem;
  revalidatePath(`/dashboard/jobs/${item.job_id}`);
  return { success: true, data: item };
}

export async function deleteJobItemPhoto(
  id: string
): Promise<ActionResult<JobItem>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return { success: false, error: "Organization not found" };

  const { data: existingItem, error: fetchError } = await supabase
    .from("job_items")
    .select("id, job_id, photo_url")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (fetchError || !existingItem) {
    return { success: false, error: "Job item not found" };
  }

  if (existingItem.photo_url) {
    // Extract storage path from the public URL
    const url = new URL(existingItem.photo_url);
    const storagePath = url.pathname.split("/job-photos/")[1];
    if (storagePath) {
      await supabase.storage.from("job-photos").remove([storagePath]);
    }
  }

  const { data, error } = await supabase
    .from("job_items")
    .update({ photo_url: null })
    .eq("id", id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const item = data as JobItem;
  revalidatePath(`/dashboard/jobs/${item.job_id}`);
  return { success: true, data: item };
}
