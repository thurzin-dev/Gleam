import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const plan = body.plan as PlanKey;
  const interval = (body.interval as "month" | "year") ?? "month";

  if (!(plan in PLANS)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Only owners can subscribe" }, { status: 403 });
  }

  const serviceClient = await createServiceClient();
  const { data: org } = await serviceClient
    .from("organizations")
    .select("id, name, stripe_customer_id")
    .eq("id", profile.org_id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  let customerId = org.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: { org_id: org.id },
    });
    customerId = customer.id;

    await serviceClient
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  const planConfig = PLANS[plan];
  const unitAmount =
    interval === "year" ? planConfig.yearlyPrice : planConfig.monthlyPrice;

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Gleam ${planConfig.name}` },
          unit_amount: unitAmount,
          recurring: { interval },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: { plan, org_id: org.id },
    },
    success_url: `${origin}/dashboard?billing=success`,
    cancel_url: `${origin}/billing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
