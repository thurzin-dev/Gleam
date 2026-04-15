"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";

export async function signUp(formData: FormData): Promise<ActionResult> {
  // SECURITY: Use the admin client for the entire signup flow.
  //
  // Calling supabase.auth.signUp() on a createServerClient instance triggers its setAll
  // cookie callback, replacing the anonymous (or non-existent) session with the new user's
  // token before the org and profile inserts run. At that point:
  //   - organizations has no RLS INSERT policy → org insert succeeds
  //   - profiles has no RLS INSERT policy → profile insert is blocked
  // The admin (service_role) client bypasses RLS for these bootstrap operations and never
  // modifies session cookies, so the subsequent signInWithPassword gives a clean session.
  const adminClient = createAdminClient();
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const orgName = formData.get("org_name") as string;

  // 1. Create auth user via admin — does not set session cookies
  const { data: authData, error: signUpError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (signUpError || !authData.user) {
    return { success: false, error: signUpError?.message ?? "Sign-up failed" };
  }

  const userId = authData.user.id;

  // 2. Create organization (admin client — no INSERT policy exists)
  const { data: org, error: orgError } = await adminClient
    .from("organizations")
    .insert({ name: orgName })
    .select("id")
    .single();

  if (orgError || !org) {
    await adminClient.auth.admin.deleteUser(userId);
    return { success: false, error: "Failed to create organization" };
  }

  // 3. Create owner profile (admin client — no INSERT policy exists)
  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userId,
    org_id: org.id,
    full_name: fullName,
    role: "owner",
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    return { success: false, error: "Failed to create profile" };
  }

  // 4. Sign the user in via the session-bound client so the cookie is set correctly
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { success: false, error: "Account created but sign-in failed. Please log in manually." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Route by role — owners to /dashboard, cleaners to /app. Relying only on
  // middleware would land every cleaner on /dashboard first and then bounce
  // them, exposing a split-second of owner UI in the network tab.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", signInData.user!.id)
    .single();

  revalidatePath("/", "layout");
  redirect(profile?.role === "cleaner" ? "/app" : "/dashboard");
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
