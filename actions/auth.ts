"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const orgName = formData.get("org_name") as string;

  // 1. Create auth user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message ?? "Sign-up failed" };
  }

  const userId = authData.user.id;

  // 2. Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName })
    .select("id")
    .single();

  if (orgError || !org) {
    return { success: false, error: "Failed to create organization" };
  }

  // 3. Create owner profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    org_id: org.id,
    full_name: fullName,
    role: "owner",
  });

  if (profileError) {
    return { success: false, error: "Failed to create profile" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const origin = (formData.get("origin") as string) ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const redirectTo = origin ? `${origin}/reset-password` : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/**
 * Accept a cleaner invite: called from `/join/[orgId]` after the org link
 * has been validated. Creates an auth user and a cleaner profile under the
 * invited org. The orgId comes from the route; we trust that the link is
 * shared only by the owner.
 */
export async function acceptCleanerInvite(
  orgId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  // Validate that the org actually exists before signing anyone up.
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .maybeSingle();

  if (orgError || !org) {
    return { success: false, error: "Invalid invite link" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message ?? "Sign-up failed" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    org_id: orgId,
    full_name: fullName,
    role: "cleaner",
  });

  if (profileError) {
    return { success: false, error: "Failed to create cleaner profile" };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
