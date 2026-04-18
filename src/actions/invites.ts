"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type InvitePreview = {
  token: string;
  orgName: string;
  expiresAt: string;
  email: string | null;
};

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? ""
  );
}

/**
 * Owner-only. Generates a single-use, 7-day invite token and stores it
 * scoped to the owner's org_id. The cleaner will sign up via
 * /auth/invite/[token] and be inserted into THAT org — no new org is
 * ever created here.
 */
export async function createInvite(
  email?: string
): Promise<ActionResult<{ url: string; token: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: caller, error: callerError } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (callerError || !caller) {
    return { success: false, error: "Profile not found" };
  }
  if (caller.role !== "owner") {
    return { success: false, error: "Only owners can invite cleaners" };
  }

  const token = randomBytes(24).toString("base64url");
  const cleanEmail = email?.trim() ? email.trim().toLowerCase() : null;

  const { error: insertError } = await supabase.from("team_invites").insert({
    token,
    org_id: caller.org_id,
    email: cleanEmail,
    created_by: user.id,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  const base = siteOrigin();
  const path = `/auth/invite/${token}`;
  const url = base ? `${base}${path}` : path;

  revalidatePath("/dashboard/team");
  return { success: true, data: { url, token } };
}

/**
 * Public lookup. Returns minimal org info so the invite page can show
 * the inviting company. Validates the token (exists, not used, not expired).
 * Uses the service role because the visitor is unauthenticated.
 */
export async function getInvite(
  token: string
): Promise<ActionResult<InvitePreview>> {
  if (!token) return { success: false, error: "Invalid invite link" };

  const admin = await createServiceClient();

  const { data: invite, error } = await admin
    .from("team_invites")
    .select("token, org_id, email, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !invite) {
    return { success: false, error: "Invite not found" };
  }
  if (invite.used_at) {
    return { success: false, error: "This invite has already been used" };
  }
  if (new Date(invite.expires_at) < new Date()) {
    return { success: false, error: "This invite has expired" };
  }

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("name")
    .eq("id", invite.org_id)
    .single();

  if (orgError || !org) {
    return { success: false, error: "Organization no longer exists" };
  }

  return {
    success: true,
    data: {
      token: invite.token,
      orgName: org.name,
      expiresAt: invite.expires_at,
      email: invite.email,
    },
  };
}

/**
 * Public mutation. Creates the auth user, the cleaner profile under the
 * INVITING org_id (never a new org), and marks the invite consumed.
 * Service role is required because the caller is unauthenticated and to
 * bypass the profiles insert restriction.
 */
export async function acceptInvite(
  token: string,
  formData: FormData
): Promise<ActionResult> {
  const fullName = (formData.get("full_name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!fullName) return { success: false, error: "Full name is required" };
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return { success: false, error: "A valid email is required" };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const admin = await createServiceClient();

  // Re-validate the token under the service role.
  const { data: invite, error: inviteError } = await admin
    .from("team_invites")
    .select("token, org_id, email, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    return { success: false, error: "Invite not found" };
  }
  if (invite.used_at) {
    return { success: false, error: "This invite has already been used" };
  }
  if (new Date(invite.expires_at) < new Date()) {
    return { success: false, error: "This invite has expired" };
  }
  if (invite.email && invite.email !== email) {
    return {
      success: false,
      error: "This invite was issued to a different email address",
    };
  }

  // Create the auth user (auto-confirm so they can log in immediately).
  const { data: created, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createUserError || !created.user) {
    return {
      success: false,
      error: createUserError?.message ?? "Failed to create account",
    };
  }

  // Create cleaner profile under the INVITING org. Critical: never
  // create a new organization in this flow.
  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    org_id: invite.org_id,
    full_name: fullName,
    role: "cleaner",
  });

  if (profileError) {
    // Roll back the auth user so they can retry without a stuck account.
    await admin.auth.admin.deleteUser(created.user.id);
    return { success: false, error: "Failed to create cleaner profile" };
  }

  // Mark invite consumed.
  await admin
    .from("team_invites")
    .update({ used_at: new Date().toISOString(), used_by: created.user.id })
    .eq("token", token);

  return { success: true, data: undefined };
}
