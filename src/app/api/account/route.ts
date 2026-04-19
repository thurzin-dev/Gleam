import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type IncomingBody = {
  full_name?: unknown;
  avatar_url?: unknown;
  company_name?: unknown;
};

function validString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, org_id, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "owner") {
    return NextResponse.json(
      { error: "Only owners can update company settings" },
      { status: 403 }
    );
  }

  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fullName =
    body.full_name !== undefined ? validString(body.full_name) : null;
  const companyName =
    body.company_name !== undefined ? validString(body.company_name) : null;

  let avatarUrl: string | null | undefined;
  if (body.avatar_url === null) {
    avatarUrl = null;
  } else if (body.avatar_url !== undefined) {
    avatarUrl = validUrl(body.avatar_url);
    if (avatarUrl === null) {
      return NextResponse.json({ error: "Invalid avatar URL" }, { status: 400 });
    }
  }

  const hasAnyField =
    (body.full_name !== undefined && fullName !== null) ||
    (body.company_name !== undefined && companyName !== null) ||
    body.avatar_url !== undefined;

  if (!hasAnyField) {
    return NextResponse.json(
      { error: "Provide at least one of full_name, company_name, avatar_url" },
      { status: 400 }
    );
  }

  // Update profile row if full_name was provided.
  let newFullName: string | null = profile.full_name;
  if (fullName) {
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile.id)
      .eq("org_id", profile.org_id)
      .select("full_name")
      .maybeSingle();
    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
    newFullName = updated.full_name;
  }

  // Update organization name if provided. RLS blocks direct org updates to
  // non-admin users by default; use the service client and scope the update
  // to the caller's own org_id to avoid cross-tenant writes.
  let newCompanyName: string | null = null;
  if (companyName) {
    const serviceClient = await createServiceClient();
    const { data: updatedOrg, error: orgError } = await serviceClient
      .from("organizations")
      .update({ name: companyName })
      .eq("id", profile.org_id)
      .select("name")
      .maybeSingle();
    if (orgError || !updatedOrg) {
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 }
      );
    }
    newCompanyName = updatedOrg.name;
  }

  // avatar_url: stored in auth user metadata until a migration adds a column.
  let newAvatarUrl: string | null = null;
  if (avatarUrl !== undefined) {
    const { data: updated, error: metaError } = await supabase.auth.updateUser({
      data: {
        ...(user.user_metadata ?? {}),
        avatar_url: avatarUrl,
      },
    });
    if (metaError) {
      return NextResponse.json(
        { error: "Failed to update avatar" },
        { status: 500 }
      );
    }
    newAvatarUrl =
      (updated.user?.user_metadata?.avatar_url as string | null | undefined) ??
      null;
  }

  return NextResponse.json({
    data: {
      full_name: newFullName,
      company_name: newCompanyName,
      avatar_url: newAvatarUrl,
    },
  });
}
