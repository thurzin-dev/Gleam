import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Refresh session — do not remove this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isJoinRoute = pathname.startsWith("/join");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAppRoute = pathname.startsWith("/app");
  const isProtectedRoute = isDashboardRoute || isAppRoute;

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user && !isAuthRoute && !isJoinRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // An authenticated user must not be allowed to consume an invite link.
  // Risks if we don't block this:
  //   - The user's existing session could be silently re-bound to a different org.
  //   - The invite token would be "consumed" without creating a new account,
  //     potentially locking out the intended recipient.
  //   - An attacker who has compromised one account could use stolen invite
  //     links to probe valid org IDs.
  if (user && isJoinRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Role-based routing separation.
  //
  // Owners manage their company from /dashboard/*; cleaners execute jobs from /app/*.
  // Crossing the boundary is a privilege-boundary violation: a cleaner loading
  // /dashboard/properties would render an owner-only UI (even if RLS blocks the
  // underlying writes, we never want the UI surface to leak), and an owner wandering
  // into /app routes would hit flows that assume a cleaner's session shape.
  //
  // The role lookup costs one DB round-trip per protected request. We accept that
  // over trusting a client-set cookie or header. JWT custom claims would remove the
  // round-trip but require a Supabase project-level change out of scope for this audit.
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // A user with no profile row is an inconsistent state (e.g. signup interrupted
    // between auth.users insert and profiles insert). Sign them out defensively and
    // send them to /login — do NOT let them freely roam protected routes.
    if (!profile) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (profile.role === "cleaner" && isDashboardRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    if (profile.role === "owner" && isAppRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
