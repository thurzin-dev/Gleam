import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function safeNext(value: string | null): string | null {
  if (!value) return null;
  // Only allow same-origin relative paths
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_session`);
  }

  // Password recovery: skip profile bootstrap, send user to set a new password.
  if (next === "/reset-password") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // Look up the profile via the service client so RLS can't hide it.
  const admin = await createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  let role = profile?.role as "owner" | "cleaner" | undefined;

  // First sign-in after email verification (or first Google OAuth) and no
  // profile yet → bootstrap the org + owner profile from signup metadata.
  // Cleaners get their profile created by the invite flow, NEVER here.
  if (!profile) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const intendedRole = (meta.intended_role as string) ?? "owner";

    if (intendedRole !== "owner") {
      // Cleaner with no profile = invite was never completed. Don't auto-create.
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=no_account`);
    }

    const companyName =
      (meta.company_name as string)?.trim() ||
      (user.email ? `${user.email.split("@")[0]}'s Company` : "My Company");
    const fullName =
      (meta.full_name as string)?.trim() ||
      (user.user_metadata?.name as string) ||
      user.email ||
      "Owner";

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: companyName })
      .select("id")
      .single();

    if (orgError || !org) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(orgError?.message ?? "org_create_failed")}`
      );
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: user.id,
      org_id: org.id,
      full_name: fullName,
      role: "owner",
    });

    if (profileError) {
      // Roll back the orphan org so we don't leak empty tenants.
      await admin.from("organizations").delete().eq("id", org.id);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(profileError.message)}`
      );
    }

    role = "owner";
  }

  const destination = next ?? (role === "cleaner" ? "/app" : "/dashboard");
  return NextResponse.redirect(`${origin}${destination}`);
}
