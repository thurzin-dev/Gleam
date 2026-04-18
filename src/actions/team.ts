"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type TeamMember = {
  id: string;
  full_name: string;
  email: string | null;
  status: "active" | "invited";
  created_at: string;
};

export type TeamInvite = {
  token: string;
  email: string | null;
  expires_at: string;
  created_at: string;
};

export type TeamData = {
  cleaners: TeamMember[];
  pendingInvites: TeamInvite[];
};

/**
 * Owner-only. Returns the cleaners in the caller's org plus any unused,
 * unexpired team_invites so the team page can render both.
 */
export async function getTeam(): Promise<ActionResult<TeamData>> {
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
    return { success: false, error: "Only owners can view the team" };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("org_id", caller.org_id)
    .eq("role", "cleaner")
    .order("full_name", { ascending: true });

  if (profilesError) {
    return { success: false, error: profilesError.message };
  }

  // Emails live in auth.users — fetch via service role to enrich each profile.
  const admin = await createServiceClient();
  const cleaners: TeamMember[] = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const { data: authUser } = await admin.auth.admin.getUserById(p.id);
      return {
        id: p.id,
        full_name: p.full_name,
        email: authUser?.user?.email ?? null,
        status: "active",
        created_at: p.created_at,
      };
    })
  );

  const { data: invites } = await supabase
    .from("team_invites")
    .select("token, email, expires_at, created_at, used_at")
    .eq("org_id", caller.org_id)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  const pendingInvites: TeamInvite[] = (invites ?? []).map((i) => ({
    token: i.token,
    email: i.email,
    expires_at: i.expires_at,
    created_at: i.created_at,
  }));

  return { success: true, data: { cleaners, pendingInvites } };
}

/**
 * Owner-only. Removes a cleaner from the org. Deletes both the auth user
 * (which cascades to the profile via FK) and any pending invites for them.
 *
 * Service role is required because Supabase Auth user deletion requires
 * admin privileges, and the org_id check below guarantees the caller can
 * only delete cleaners in their own org.
 */
export async function removeEmployee(
  profileId: string
): Promise<ActionResult> {
  if (!profileId) return { success: false, error: "Missing employee id" };

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
    return { success: false, error: "Only owners can remove cleaners" };
  }
  if (profileId === user.id) {
    return { success: false, error: "You cannot remove yourself" };
  }

  // Verify the target profile is a cleaner in the caller's org. This is the
  // org-isolation gate — without it, an owner could delete profiles in any
  // other org since the next step uses the service role.
  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, org_id, role")
    .eq("id", profileId)
    .maybeSingle();

  if (targetError || !target) {
    return { success: false, error: "Employee not found" };
  }
  if (target.org_id !== caller.org_id) {
    return { success: false, error: "Employee not in your organization" };
  }
  if (target.role !== "cleaner") {
    return { success: false, error: "Only cleaners can be removed" };
  }

  const admin = await createServiceClient();

  // Deleting the auth user cascades to public.profiles via the FK
  // (profiles.id references auth.users(id) on delete cascade).
  const { error: deleteError } = await admin.auth.admin.deleteUser(profileId);
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/dashboard/team");
  return { success: true, data: undefined };
}

/**
 * Owner-only. Revokes a pending invite by deleting the row.
 */
export async function revokeInvite(token: string): Promise<ActionResult> {
  if (!token) return { success: false, error: "Missing invite token" };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // RLS on team_invites enforces org_id + owner role for delete.
  const { error } = await supabase
    .from("team_invites")
    .delete()
    .eq("token", token);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true, data: undefined };
}
