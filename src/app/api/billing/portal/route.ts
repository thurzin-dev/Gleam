import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

async function createPortalSession(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", profile.org_id)
    .maybeSingle();

  if (!org?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    );
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe not configured" },
      { status: 500 }
    );
  }

  const origin = request.nextUrl.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${origin}/dashboard/settings/plan`,
  });

  return NextResponse.json({ url: session.url });
}

export async function POST(request: NextRequest) {
  return createPortalSession(request);
}

export async function GET(request: NextRequest) {
  return createPortalSession(request);
}
