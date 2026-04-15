"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ActionResult } from "@/lib/types";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return null;
  return data as Profile;
}

export async function updateProfile(
  formData: FormData
): Promise<ActionResult<Profile>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const fullName = formData.get("full_name") as string;

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard", "layout");
  return { success: true, data: data as Profile };
}

export async function inviteCleaner(
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify caller is an owner
  const { data: callerProfile, error: callerError } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (callerError || !callerProfile) {
    return { success: false, error: "Profile not found" };
  }

  if (callerProfile.role !== "owner") {
    return { success: false, error: "Only owners can invite cleaners" };
  }

  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const password = formData.get("password") as string;

  // Create auth user for the cleaner
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message ?? "Sign-up failed" };
  }

  // Create cleaner profile under the same org
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    org_id: callerProfile.org_id,
    full_name: fullName,
    role: "cleaner",
  });

  if (profileError) {
    return { success: false, error: "Failed to create cleaner profile" };
  }

  return { success: true, data: undefined };
}

export async function listCleaners(): Promise<ActionResult<Profile[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { data: callerProfile, error: callerError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (callerError || !callerProfile) {
    return { success: false, error: "Profile not found" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", callerProfile.org_id)
    .eq("role", "cleaner")
    .order("full_name");

  if (error) return { success: false, error: error.message };
  return { success: true, data: data as Profile[] };
}
