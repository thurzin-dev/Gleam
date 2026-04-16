import { NextRequest, NextResponse } from "next/server";
import { stripe, cleanerLimitForPlan, OVERAGE_UNIT_PRICE } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, plan, stripe_customer_id, subscription_status")
    .eq("subscription_status", "active");

  if (!orgs?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const org of orgs) {
    const limit = cleanerLimitForPlan(org.plan);
    if (limit === Infinity) continue;

    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("role", "cleaner");

    const cleanerCount = count ?? 0;
    const overage = cleanerCount - limit;

    if (overage <= 0 || !org.stripe_customer_id) continue;

    const amount = overage * OVERAGE_UNIT_PRICE;

    await stripe.invoiceItems.create({
      customer: org.stripe_customer_id,
      amount,
      currency: "usd",
      description: `Overage: ${overage} cleaner(s) above ${org.plan} limit`,
    });

    processed++;
  }

  return NextResponse.json({ processed });
}
