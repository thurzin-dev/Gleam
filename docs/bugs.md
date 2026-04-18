# Gleam — Bug Fix Log

## 2026-04-18 — Auth & access-control sweep (security agent)

### 1. Sign-in accepted any input — no Supabase call, no profile check
- **Reproduced:** typing any email + password on `/login` showed a success toast
  and pushed to `/dashboard` (`setTimeout` placeholder, never called Supabase).
- **Fix:** new server action `signInWithPassword` in `src/actions/auth.ts`.
  Calls `supabase.auth.signInWithPassword`, then looks up the `profiles` row
  via the service client. If no profile exists, the session is signed out and
  the action returns: `"No account found. Please sign up first."`.
  Login page wired to the action; no more `setTimeout` simulation.
- **Verified:** sign-in with an unknown email → toast shows the exact message
  and the user is not redirected. Sign-in with a real account routes by role
  (`owner → /dashboard`, `cleaner → /app`).

### 2. Sign-up auto-logged-in users without verifying email
- **Reproduced:** submitting `/signup` showed a success toast and pushed to
  `/dashboard` immediately (also a `setTimeout` placeholder). No email sent.
- **Fix:**
  - `signUpOwner` action in `src/actions/auth.ts` calls `supabase.auth.signUp`
    with `emailRedirectTo: <origin>/auth/callback?next=/dashboard` and stores
    `full_name`, `company_name`, and `intended_role: "owner"` in user metadata.
  - If the project is configured *without* email confirmations, the action
    immediately signs out the returned session — verification is enforced
    regardless of project setting.
  - User is redirected to `/verify-email?email=…` ("Check your inbox"), with a
    "Resend verification email" button (`resendVerification` action).
  - The org + owner profile are NOT created at sign-up — they are created on
    first verified callback (see #3) so unverified accounts never leave
    orphan tenants.
  - Middleware blocks any authed user without `email_confirmed_at` from
    every protected route, redirecting to `/verify-email`.
- **Verified:** sign-up sends the email, no session is created, and visiting
  `/dashboard` or `/app` while unverified bounces to `/verify-email`.

### 3. Google OAuth — callback didn't bootstrap profiles
- **Reproduced:** "Continue with Google" succeeded but if the Google account
  had no `profiles` row, the user landed on `/dashboard` and every query
  failed (no `org_id`).
- **Fix:** `src/app/auth/callback/route.ts` now:
  1. Calls `exchangeCodeForSession`.
  2. Looks up the profile via the service client.
  3. If missing AND `intended_role === "owner"` (or unset, defaulting to owner
     for first-time Google sign-in): creates an `organizations` row using
     `company_name` from metadata (or `"<email-prefix>'s Company"` for Google),
     then inserts the `profiles` row with role `owner`. Rolls back the org
     if profile insert fails — no orphan tenants.
  4. If profile missing AND intended role is `cleaner`: signs out and
     redirects to `/login?error=no_account` (cleaners must come through the
     invite flow).
  5. Honors a sanitized `?next=` parameter (only same-origin paths).
- **Manual step:** in Supabase Dashboard → Authentication → URL Configuration,
  ensure these Redirect URLs are listed:
    - `http://localhost:3000/auth/callback`
    - `https://gleamqc.com/auth/callback`
  And under Authentication → Providers → Google, the OAuth client must be
  enabled with the correct client ID/secret. Site URL should be
  `https://gleamqc.com` in prod.

### 4. Forgot password flow — broken (link went nowhere)
- **Reproduced:** "Forgot password?" on `/login` was an `<a href="#">`. No
  reset email could be sent and there was no reset page.
- **Fix:**
  - Login page now links to `/forgot-password`.
  - New page `/forgot-password` calls `requestPasswordReset` action, which
    invokes `supabase.auth.resetPasswordForEmail(email, { redirectTo:
    "<origin>/auth/callback?next=/reset-password" })`. Uses
    `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` via the
    standard SSR server client. The action never reveals whether the email
    exists — always returns success.
  - The reset email's link hits `/auth/callback?code=…&next=/reset-password`,
    which exchanges the code for a session and redirects to `/reset-password`
    (skipping the profile-bootstrap branch).
  - `/reset-password` checks for an active session, then calls
    `supabase.auth.updateUser({ password })`, signs the user out, and pushes
    them to `/login` to re-authenticate with the new password. If no session
    is present (link expired), it shows a "Request a new link" CTA.
- **Verified:** request → email arrives → link opens `/reset-password` →
  setting a new password works → next sign-in must use the new password.

### 5. Trial expiry — only frontend hint, no server-side hard gate
- **Reproduced:** middleware did redirect to `/billing` once trial expired,
  but several siblings (e.g. `/forgot-password`, `/reset-password`,
  `/verify-email`) were missing from the public list, and the gate left
  `?locked=1` unset, so the billing page couldn't render the
  non-dismissable mode reliably.
- **Fix:** middleware now enforces three layered gates in order:
  1. Unauthenticated → public-only.
  2. Authed but unverified → `/verify-email` (allowlist of permitted paths).
  3. Authed + verified → if `trial_ends_at < now()` AND
     `subscription_status !== "active"`, lock to `/billing` (allowlist of
     permitted paths only: `/billing`, `/api/billing`, `/api/webhooks`,
     `/auth/callback`, `/login`, `/signup`, `/verify-email`,
     `/forgot-password`, `/reset-password`). Adds `?locked=1` so the billing
     page can render its non-dismissable modal state.
- **Verified:** with `trial_ends_at` set in the past and no active sub, every
  app route (including API endpoints outside the allowlist) returns a 307 to
  `/billing?locked=1`. The check happens server-side on every request via
  `middleware.ts`, not in any client component.

---

### Manual verification still required

- Toggle "Confirm email" ON in Supabase Dashboard → Authentication → Providers
  → Email. Without it, signUp would otherwise issue a session immediately
  (we sign it out defensively, but the project setting should still be on).
- Set Site URL = `https://gleamqc.com` and add both callback URLs (above).
- Confirm Stripe webhook continues to update
  `organizations.subscription_status` to `"active"` on successful payment so
  the trial gate releases.
