"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";

// Checks the invite link's org exists BEFORE rendering or accepting a signup.
// Used by the /join/[orgId] page to decide between showing the form or a 404.
// Uses the admin client to read organizations — unauthenticated visitors
// have no session and would otherwise be blocked by RLS.
export async function verifyInviteOrg(orgId: string): Promise<boolean> {
  // UUID shape check first — blocks SQL-ish garbage from even hitting the DB.
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(orgId)) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .single();

  return !error && !!data;
}

export async function joinOrg(
  orgId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  // Block an already-authenticated user from consuming an invite.
  // Middleware also blocks /join/* for logged-in users, but server actions are
  // callable from anywhere — re-check here so the action is safe on its own.
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser) {
    return {
      success: false,
      error: "You are already signed in. Sign out to accept an invite.",
    };
  }

  // Validate the target org exists. Without this check, anyone could POST
  // to this action with a random UUID and succeed in creating an orphan
  // profile pointing at a non-existent org (FK would catch it, but we give
  // a clean error and avoid burning a user row on rollback).
  const orgExists = await verifyInviteOrg(orgId);
  if (!orgExists) {
    return { success: false, error: "Invalid invite link" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password || !fullName) {
    return { success: false, error: "All fields are required" };
  }

  // Admin client for the same reason signUp uses it: we must create the auth
  // user + profile atomically without triggering the session-bound client's
  // cookie callback mid-flow.
  const admin = createAdminClient();

  const { data: authData, error: signUpError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (signUpError || !authData.user) {
    return {
      success: false,
      error: signUpError?.message ?? "Failed to create account",
    };
  }

  // Profile is hard-pinned to the invite's orgId and role='cleaner'.
  // We never read the org_id or role from formData — a malicious client
  // could otherwise POST org_id=<rival-org> or role=owner.
  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    org_id: orgId,
    full_name: fullName,
    role: "cleaner",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { success: false, error: "Failed to create profile" };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      success: false,
      error: "Account created but sign-in failed. Please log in manually.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/app");
}
