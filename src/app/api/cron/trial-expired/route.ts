import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();

  // Orgs whose trial ended and who have no active paid subscription.
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, trial_ends_at, subscription_status")
    .lt("trial_ends_at", now.toISOString())
    .neq("subscription_status", "active");

  if (!orgs?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const billingUrl = `${siteUrl}/billing`;
  let sent = 0;

  for (const org of orgs) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("id")
      .eq("org_id", org.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (!owner) continue;

    const { data: authUser } = await supabase.auth.admin.getUserById(owner.id);
    const authProfile = authUser?.user;
    const email = authProfile?.email;
    if (!authProfile || !email) continue;

    // Idempotency: skip owners we've already notified. The flag lives in
    // auth user metadata so no schema migration is required for this route.
    const metadata = authProfile.user_metadata as Record<string, unknown> | undefined;
    if (metadata?.trial_expired_notified_at) continue;

    // Supabase Auth's built-in transactional email: inviteUserByEmail is the
    // simplest channel available without wiring a separate provider. The
    // template content is managed in the Supabase dashboard; metadata here is
    // passed to the email template so the subject line and CTA render
    // correctly. In production this should be migrated to Resend/Postmark.
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          type: "trial_expired",
          subject: "Your Gleam trial has ended",
          org_name: org.name,
          billing_url: billingUrl,
        },
        redirectTo: billingUrl,
      }
    );

    if (inviteError) continue;

    await supabase.auth.admin.updateUserById(owner.id, {
      user_metadata: {
        ...(metadata ?? {}),
        trial_expired_notified_at: new Date().toISOString(),
      },
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
