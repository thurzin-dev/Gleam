"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; redirectTo?: string };

async function originUrl(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Owner sign-up.
 * Creates the auth user, fires the verification email, and immediately signs
 * the session out so the user MUST confirm their email before accessing the app.
 * Org + profile are created later, in the /auth/callback handler, after verification.
 */
export async function signUpOwner(input: {
  email: string;
  password: string;
  fullName: string;
  company: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const company = input.company.trim();

  if (!email || !input.password || !fullName || !company) {
    return { error: "All fields are required." };
  }
  if (input.password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const origin = await originUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        full_name: fullName,
        company_name: company,
        intended_role: "owner",
      },
    },
  });

  if (error) return { error: error.message };

  // Defensive: if the project is configured WITHOUT email confirmation,
  // signUp returns a session immediately. Force sign-out so the verification
  // gate is always enforced regardless of project config.
  if (data.session) {
    await supabase.auth.signOut();
  }

  return { redirectTo: `/verify-email?email=${encodeURIComponent(email)}` };
}

/**
 * Password sign-in.
 * Rejects if no profile row exists for the user — i.e. they never completed
 * sign-up — by signing the session back out and surfacing a clear error.
 */
export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed")) {
      return {
        error: "Please verify your email before signing in.",
        redirectTo: `/verify-email?email=${encodeURIComponent(email)}`,
      };
    }
    if (msg.includes("invalid login")) {
      return { error: "Incorrect email or password." };
    }
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    await supabase.auth.signOut();
    return { error: "Sign-in failed. Please try again." };
  }

  // Verification gate (defensive — also enforced by middleware).
  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    return {
      error: "Please verify your email before signing in.",
      redirectTo: `/verify-email?email=${encodeURIComponent(email)}`,
    };
  }

  // Use the service client to look up the profile so RLS misconfig can't
  // make a real account look like a missing one.
  const admin = await createServiceClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return { error: "Could not load your account. Please try again." };
  }

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "No account found. Please sign up first." };
  }

  revalidatePath("/", "layout");
  return { redirectTo: profile.role === "cleaner" ? "/app" : "/dashboard" };
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const origin = await originUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Do not leak whether the email exists. Always return success.
  if (error && !error.message.toLowerCase().includes("user not found")) {
    return { error: error.message };
  }

  return {};
}

export async function resendVerification(input: {
  email: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  const origin = await originUrl();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard` },
  });

  if (error) return { error: error.message };
  return {};
}
