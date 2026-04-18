import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public to everyone — no session required.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/join",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/invite",
  "/api/webhooks",
];

// Allowed for users who are signed in but have NOT yet verified their email.
const UNVERIFIED_ALLOWED = [
  "/verify-email",
  "/auth/callback",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/webhooks",
];

// Allowed for users whose trial expired AND have no active subscription.
// The hard gate: every other app route is locked to /billing.
const TRIAL_LOCKED_ALLOWED = [
  "/billing",
  "/api/billing",
  "/api/webhooks",
  "/auth/callback",
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

function pathMatches(pathname: string, list: string[]) {
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isPublic(pathname: string) {
  return pathMatches(pathname, PUBLIC_PATHS);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname === "/login" || pathname === "/signup";

  // 1) Unauthenticated users → only public paths and the landing page.
  if (!user) {
    if (isPublic(pathname) || pathname === "/") return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2) Email-not-verified gate. Block protected routes until confirmed.
  //    Defensive: most flows already require confirmation before a session is
  //    issued, but a session without email_confirmed_at must never reach the app.
  if (!user.email_confirmed_at && !pathMatches(pathname, UNVERIFIED_ALLOWED)) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify-email";
    if (user.email) url.searchParams.set("email", user.email);
    return NextResponse.redirect(url);
  }

  // 3) Authenticated + verified visiting login/signup → bounce to dashboard.
  if (user.email_confirmed_at && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 4) Trial / subscription hard gate. Server-side, every protected route.
  //    Once trial_ends_at is in the past AND subscription_status is not active,
  //    every route except the billing/auth allowlist is forced to /billing.
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.org_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("subscription_status, trial_ends_at")
      .eq("id", profile.org_id)
      .maybeSingle();

    if (org) {
      const trialExpired =
        !!org.trial_ends_at && new Date(org.trial_ends_at) < new Date();
      const isActive = org.subscription_status === "active";

      if (trialExpired && !isActive && !pathMatches(pathname, TRIAL_LOCKED_ALLOWED)) {
        const url = request.nextUrl.clone();
        url.pathname = "/billing";
        url.searchParams.set("locked", "1");
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
