import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

async function updateOrg(
  stripeCustomerId: string,
  fields: Record<string, unknown>
) {
  const supabase = await createServiceClient();
  await supabase
    .from("organizations")
    .update(fields)
    .eq("stripe_customer_id", stripeCustomerId);
}

function planFromPriceId(_priceId: string): string {
  // Map from Stripe price IDs set as metadata on the subscription.
  // Fallback: read metadata.plan that we attach during checkout.
  return "starter";
}

function extractPlan(sub: Stripe.Subscription): string {
  return (sub.metadata?.plan as string) ?? planFromPriceId(sub.items.data[0]?.price?.id ?? "");
}

export async function POST(request: NextRequest) {
  // Validate environment before doing anything else. If either env var is
  // missing, return a clear 500 — not the opaque Stripe SDK error that used
  // to surface as "Neither apiKey nor config.authenticator provided".
  let stripe: ReturnType<typeof getStripe>;
  let webhookSecret: string;
  try {
    stripe = getStripe();
    webhookSecret = getWebhookSecret();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stripe misconfigured";
    console.error("[stripe webhook] config error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const plan = extractPlan(sub);
      const periodEnd = sub.items.data[0]?.current_period_end;
      await updateOrg(customerId, {
        plan,
        stripe_subscription_id: sub.id,
        subscription_status: sub.status === "active" ? "active" : sub.status,
        ...(periodEnd && {
          current_period_end: new Date(periodEnd * 1000).toISOString(),
        }),
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await updateOrg(customerId, {
        subscription_status: "canceled",
        plan: "trial",
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (customerId) {
        await updateOrg(customerId, { subscription_status: "past_due" });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
