# Gleam — Security & Auth Reference

> Owned by the security agent. Update on every policy or auth-flow change.

---

## Auth flow contracts

### Owner sign-up
1. POST `/signup` (form) → server action `signUpOwner`
2. `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: { full_name, company_name, intended_role: "owner" }}})`
3. If a session is returned (project setting "Confirm email" off), the action
   immediately calls `signOut()` — verification is enforced regardless.
4. Redirect → `/verify-email?email=…`
5. User clicks email link → `/auth/callback?code=…&next=/dashboard`
6. Callback: `exchangeCodeForSession` → service-role insert into
   `organizations` (uses `company_name` from metadata) → service-role insert
   into `profiles` with role `owner`. On profile-insert failure, the org row
   is rolled back.
7. Redirect → `/dashboard`.

### Cleaner sign-up (invite)
- `/join/[orgId]` (or invite token flow) creates the profile with role
  `cleaner` against the existing `org_id`. **Never** creates an organization.
- Cleaners must complete the invite flow before they can sign in.
- The auth callback route refuses to bootstrap a profile for `intended_role
  !== "owner"` — a cleaner who tries to sign in without a profile gets
  `?error=no_account` and is signed out.

### Sign-in (password)
1. POST `/login` → server action `signInWithPassword`
2. `supabase.auth.signInWithPassword`
3. If error message contains "email not confirmed" → return error +
   `redirectTo: /verify-email?email=…`.
4. After success, look up `profiles.id` via the **service client**. If no
   profile row → sign out and return `"No account found. Please sign up
   first."`.
5. If `email_confirmed_at` is null → sign out, return verification error.
6. Redirect by role: `cleaner → /app`, otherwise `/dashboard`.

### Sign-in (Google OAuth)
1. Client `supabase.auth.signInWithOAuth({ provider: "google", options: {
   redirectTo: <origin>/auth/callback }})`.
2. Google → `/auth/callback?code=…`. Same handler as email verify.
3. First-ever Google login (no profile) is treated as an owner sign-up; org
   name defaults to `"<email-prefix>'s Company"` if no `company_name` was set.

#### Required Supabase Dashboard configuration
- Authentication → URL Configuration → Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://gleamqc.com/auth/callback`
- Authentication → URL Configuration → Site URL: `https://gleamqc.com`
- Authentication → Providers → Google: enabled, client ID + secret set.
- Authentication → Providers → Email: "Confirm email" ON.

### Forgot password
1. POST `/forgot-password` → action `requestPasswordReset` →
   `supabase.auth.resetPasswordForEmail(email, { redirectTo:
   "<origin>/auth/callback?next=/reset-password" })`. Action never reveals
   whether the email exists (always returns success).
2. Email link → `/auth/callback?code=…&next=/reset-password` →
   `exchangeCodeForSession` → redirect `/reset-password` (skips
   profile-bootstrap branch).
3. `/reset-password` checks for an active session, then
   `supabase.auth.updateUser({ password })`, signs out, pushes `/login`.
4. If link expired and no session is present, the page shows a "Request a
   new link" CTA pointing at `/forgot-password`.

---

## Middleware gates (`src/middleware.ts`)

Layered checks, run in order on every matched request:

| # | Gate | Trigger | Effect |
|---|------|---------|--------|
| 1 | Authentication | `!user` && not in `PUBLIC_PATHS` && not `/` | 307 → `/login` |
| 2 | Email verification | `user && !user.email_confirmed_at` && not in `UNVERIFIED_ALLOWED` | 307 → `/verify-email?email=…` |
| 3 | Auth-page bounce | Verified user visits `/login` or `/signup` | 307 → `/dashboard` |
| 4 | Trial / subscription hard gate | `trial_ends_at < now()` && `subscription_status !== "active"` && not in `TRIAL_LOCKED_ALLOWED` | 307 → `/billing?locked=1` |

Allowlists:
- `PUBLIC_PATHS`: `/login`, `/signup`, `/join`, `/verify-email`,
  `/forgot-password`, `/reset-password`, `/auth/callback`, `/auth/invite`,
  `/api/webhooks`.
- `UNVERIFIED_ALLOWED`: `/verify-email`, `/auth/callback`, `/login`,
  `/signup`, `/forgot-password`, `/reset-password`, `/api/webhooks`.
- `TRIAL_LOCKED_ALLOWED`: `/billing`, `/api/billing`, `/api/webhooks`,
  `/auth/callback`, `/login`, `/signup`, `/verify-email`,
  `/forgot-password`, `/reset-password`.

Trial gate uses `supabase.from("organizations").select("subscription_status,
trial_ends_at")` under the user's session — RLS limits the row to their own
org, so no cross-tenant data leak.

---

## Service-role usage

`createServiceClient` (`src/lib/supabase/server.ts`) is used in exactly two
server-only contexts:
1. `signInWithPassword` — to look up `profiles` so that a misconfigured RLS
   policy can't make a real account look "missing".
2. `/auth/callback` — to insert a fresh `organizations` + `profiles` row on
   first verified sign-in (the user has no profile yet, so RLS would block
   the insert under their own session).

The service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is never bundled into the
client — `createServiceClient` is `"use server"`-only.

---

## RLS policies

Unchanged in this sweep. See `supabase/migrations/001_initial_schema.sql` for
the canonical set. All multi-tenant tables filter via `auth_org_id()`, a
`SECURITY DEFINER` SQL function that returns the caller's `profiles.org_id`.

Profile inserts are *not* allowed under user RLS — they are performed by the
service client during sign-up bootstrap. Direct inserts from authenticated
users would fail by default, which is intentional.
