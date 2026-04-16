import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find orgs still on trial that expire within 3 days
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, trial_ends_at")
    .eq("subscription_status", "trialing")
    .lte("trial_ends_at", threeDays.toISOString())
    .gte("trial_ends_at", now.toISOString());

  if (!orgs?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const org of orgs) {
    const trialEnd = new Date(org.trial_ends_at);
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Find the owner of this org
    const { data: owner } = await supabase
      .from("profiles")
      .select("id")
      .eq("org_id", org.id)
      .eq("role", "owner")
      .limit(1)
      .single();

    if (!owner) continue;

    // Fetch owner email from auth.users via admin API
    const { data: authUser } =
      await supabase.auth.admin.getUserById(owner.id);

    if (!authUser?.user?.email) continue;

    // Use Supabase's built-in email via auth admin
    // In production, wire this to a transactional email provider.
    // For now we use the auth.admin API to send a password-reset-style email
    // as a lightweight notification channel.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const billingUrl = `${siteUrl}/billing`;

    await supabase.auth.admin.inviteUserByEmail(authUser.user.email, {
      data: {
        type: "trial_warning",
        days_left: daysLeft,
        org_name: org.name,
        billing_url: billingUrl,
      },
      redirectTo: billingUrl,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
