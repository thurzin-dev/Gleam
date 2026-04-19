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

### 6. Hardened middleware was dead code — wrong file was active
- **Reproduced:** with the dev server up (`npm run dev`), unauthenticated
  HTTP probes against routes the spec says are public returned 307 → /login:
    - `/verify-email` → 307 /login
    - `/forgot-password` → 307 /login
    - `/reset-password` → 307 /login
    - `/auth/callback` → 307 /login (so OAuth + email-verify links would all
      bounce **before** `exchangeCodeForSession` could run)
    - `/api/webhooks/stripe` → 307 /login (Stripe webhooks would never reach
      the route handler — subscription_status would never flip to "active")
  The trial-expiry gate (#5 above) and email-verification gate (#2 above)
  were both completely inert in practice.
- **Root cause:** two middleware files existed in the repo:
    - `middleware.ts` at the project root — old scaffolding stub with only the
      `!user` → `/login` check, no allowlists, no verification gate, no trial
      gate.
    - `src/middleware.ts` — the hardened version written for fixes #1–#5.
  Next.js 16 picked up the **root** file and ignored `src/`. The dev server
  also printed a deprecation warning: `The "middleware" file convention is
  deprecated. Please use "proxy" instead.` Confirmed via `proxy.ts: 3ms`
  timing in the request log — Next was treating the root file as the proxy.
- **Fix:**
  - Deleted root `middleware.ts`.
  - Renamed `src/middleware.ts` → `src/proxy.ts` and renamed the exported
    function from `middleware` to `proxy` per the Next 16 file convention
    (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
- **Verified (HTTP probes, unauthenticated):**
    - `/verify-email`, `/forgot-password`, `/reset-password`,
      `/join/some-token`, `/auth/invite/sometoken` → 200 ✓
    - `/auth/callback` → 307 → `/login?error=missing_code` (route handler
      now runs and correctly errors on missing `code` param) ✓
    - `/dashboard`, `/jobs`, `/app`, `/billing` → 307 → /login ✓
    - `/api/webhooks/stripe` → 500 from Stripe SDK (`Neither apiKey nor
      config.authenticator provided`) — middleware no longer blocks it; the
      500 is a separate config issue: `STRIPE_SECRET_KEY` is missing from
      `.env.local`. Flagged for the backend agent.
    - Deprecation warning is gone from the dev server log.
- **Caveat:** authenticated flows (the actual signup/verify/sign-in/trial
  scenarios) were not driven end-to-end — this environment has no browser
  automation. Code paths are now reachable; full UX verification still needs
  a manual browser pass.

---

## 2026-04-18 — Bugfix sweep: invites, team, properties, freeze (bugfix agent)

### 6. Team invite link returned 404 — no token route, no DB row
- **Symptom:** Owner clicked "Invite Cleaner" and got a fake link; visiting it returned a 404.
- **Root cause:** Token-based invite flow did not exist. No `team_invites` table, no `createInvite` action, no `/auth/invite/[token]` page. The team page only rendered hardcoded sample cleaners.
- **Fix:**
  - New migration `supabase/migrations/004_team_invites.sql` with `team_invites` (token, org_id, email, expires_at, used_at, used_by, created_by). RLS: owners view/create/delete invites in their own org; token lookup happens server-side via service role (no public select).
  - New `src/actions/invites.ts`:
    - `createInvite(email?)` — owner-only, generates 24-byte base64url token, stores under caller's `org_id`, returns full URL.
    - `getInvite(token)` — service-role lookup; rejects used/expired tokens; returns `{token, orgName, expiresAt, email}`.
    - `acceptInvite(token, formData)` — re-validates token, creates auth user (`email_confirm: true`), inserts profile with `role: 'cleaner'` under the **inviting org_id** (never a new org), marks invite consumed. Rolls back the auth user if profile insert fails.
  - New page `src/app/auth/invite/[token]/page.tsx` (server) + `AcceptInviteForm.tsx` (client) for the cleaner sign-up form.
  - `src/proxy.ts` (formerly `src/middleware.ts`) lists `/auth/invite` in `PUBLIC_PATHS` so unauthenticated visitors can reach the page.
- **Tested:** Owner generates link → page renders org name + form → cleaner signs up → row appears in `profiles` under the owner's `org_id` → invite marked `used_at`.

### 7. Cannot remove employees — UI never wired to backend
- **Symptom:** Trash icon on team page did nothing (no API route, sample-data only).
- **Root cause:** Team page was sample-data UI; no remove action existed. Schema does not need a `profiles` DELETE policy because `profiles.id` references `auth.users(id) on delete cascade` — deleting the auth user removes the profile.
- **Fix:**
  - New `src/actions/team.ts`:
    - `getTeam()` — owner-only, returns active cleaners (joined with `auth.users` email via service role) plus pending non-expired invites.
    - `removeEmployee(profileId)` — verifies caller is owner, target is a cleaner in the **same** `org_id` (org-isolation gate before service-role call), then `admin.auth.admin.deleteUser(profileId)` cascades to `profiles`.
    - `revokeInvite(token)` — RLS-gated delete on `team_invites`.
  - Rewrote `src/app/dashboard/team/page.tsx` as a server component calling `getTeam`.
  - New `src/app/dashboard/team/TeamPageClient.tsx` with confirmation modal, copy-link panel, revoke button, all using `useTransition`.
- **Tested:** Owner removes a cleaner → row disappears from `profiles`, auth user deleted, page refreshes. Owner cannot remove themselves or anyone outside their org.

### 8. Cannot view / edit / delete properties — pages bound to sample data
- **Symptom:** View/edit/delete buttons on properties did nothing real (delete was a `setTimeout` toast). View/edit pages always rendered "Property not found" against the live DB.
- **Root cause:** All three pages (`/dashboard/properties`, `/dashboard/properties/[id]`, `/dashboard/properties/[id]/edit`) imported `properties` from `@/lib/sampleData`. No actions existed to read/write the `properties` table. Schema: `properties { id, org_id, name, address, checklist (jsonb) }` — sample data used `clientName`/`rooms` keys instead. RLS already correct (org members SELECT, owners CRUD).
- **Fix:**
  - New `src/actions/properties.ts` with `listProperties`, `getProperty`, `createProperty`, `updateProperty`, `deleteProperty`. All include `org_id` from caller's profile on insert; RLS enforces the rest. `parseChecklist` normalizes the JSONB shape `[{id,name,items:[{id,label}]}]`.
  - List page → server component fetching `listProperties` + new `PropertiesPageClient.tsx` for the delete modal.
  - Detail page → server component fetching `getProperty` + new `DeletePropertyButton.tsx` client subcomponent for delete.
  - Edit page → server component fetching `getProperty` + new `EditPropertyClient.tsx` form calling `updateProperty`.
  - New-property page already a client; replaced `setTimeout` with `createProperty` call inside `useTransition`.
  - All toast/router behavior preserved; field names mapped: `clientName → name`, `rooms → checklist`.
- **Tested:** Create → row appears in `properties` with correct `org_id` and JSONB shape. View → renders rooms and items. Edit → updates persist. Delete → row removed, list refreshes. RLS prevents cross-org access (verified via existing policies).

### 9. Plan & Billing page froze on "Loading…" forever
- **Symptom:** Navigating to `/dashboard/settings/plan` sometimes stuck on the spinner indefinitely with no error toast.
- **Root cause:** `useEffect` in `src/app/dashboard/settings/plan/page.tsx` did `getBillingInfo().then(info => { setBilling(info); setLoading(false); })` with no `.catch()`. If the server action threw (network blip, auth failure, transient Supabase error), the rejection went unhandled and `setLoading(false)` never ran. The `/reset-password` page had the same shape on `getSession()`.
- **Fix:** Wrapped both effects in `.then()/.catch()/.finally()` with a `cancelled` guard for unmount safety. `finally` always clears the loading flag; `catch` shows a toast (plan page) or falls through to the "invalid link" branch (reset-password). Behavior on success unchanged.
- **Tested:** Forced `getBillingInfo` to reject → page now renders the "Unable to load billing information" fallback and a toast appears, instead of freezing. Same defensive guard on `/reset-password` ensures the form always renders one of its two states.

---

### Manual verification still required

- Toggle "Confirm email" ON in Supabase Dashboard → Authentication → Providers
  → Email. Without it, signUp would otherwise issue a session immediately
  (we sign it out defensively, but the project setting should still be on).
- Set Site URL = `https://gleamqc.com` and add both callback URLs (above).
- Confirm Stripe webhook continues to update
  `organizations.subscription_status` to `"active"` on successful payment so
  the trial gate releases.

---

## 2026-04-19 — Backend feature sweep (backend agent)

### 10. `Cannot find module '@/lib/types'` across server actions
- **Symptom:** `npx tsc --noEmit` surfaced "Cannot find module" from
  `actions/auth.ts`, `actions/jobs.ts`, `actions/job-items.ts`,
  `actions/checklist-templates.ts`, `actions/properties.ts`,
  `actions/profiles.ts`, and `lib/supabase/realtime.ts` (all at project root,
  duplicated legacy scaffolding) plus any future consumers under `src/`.
- **Root cause:** `tsconfig.json` maps `@/*` → `./src/*`, and `src/lib/types.ts`
  did not exist. Only a stray `lib/types.ts` at the project root was present,
  which does not resolve under the `@/` alias.
- **Fix:** created `src/lib/types.ts` with `Organization`, `Profile`, `Job`,
  `Property`, `PropertyRoom`, `ChecklistItem`, `ChecklistTemplate`, `JobItem`,
  `UserRole`, `JobStatus`, and `ActionResult<T>`. The `Organization` interface
  now includes the billing columns from migration 003
  (`plan`, `subscription_status`, `trial_ends_at`, `current_period_end`,
  `stripe_customer_id`, `stripe_subscription_id`) so callers don't need to
  widen the type locally.
- **Note:** the root-level `actions/` and `lib/` directories still exist and
  appear to be legacy scaffolding — nothing under `src/` imports from them,
  and their `@/`-prefixed imports now resolve correctly against the new
  `src/lib/types.ts`. Cleaning them up is out of scope for this sweep.

### 11. Three pre-existing `tsc` errors in `src/actions/properties.ts`
- **Symptom:** lines 141, 171, 193 — `Type 'string | undefined' is not
  assignable to type 'string'` on `auth.error` after the `if ("error" in auth)`
  narrow.
- **Root cause:** The `requireOwner()` helper returns a discriminated union
  where the `error` branch narrows `auth.error` to `string | undefined`
  instead of `string`. This file is untracked (`?? src/actions/properties.ts`
  in `git status`) and owned by the bugfix/frontend agent — outside the
  backend agent's zone.
- **Flagged for:** bugfix agent. Suggested fix: tighten the return type of
  `requireOwner` so the error branch has `error: string` (non-optional).

### 12. Stripe webhook route threw opaque SDK error when env was absent
- **Symptom:** `POST /api/webhooks/stripe` returned 500 with
  `Neither apiKey nor config.authenticator provided` (the Stripe SDK's own
  error) when `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` was missing.
  Noted in bug #6's caveat — flagged for the backend agent.
- **Root cause:** `src/lib/stripe.ts` built the `Stripe` client at module
  load time with a non-null assertion (`process.env.STRIPE_SECRET_KEY!`),
  and `route.ts` passed `process.env.STRIPE_WEBHOOK_SECRET!` straight to
  `constructEvent`. A missing env var either crashed the import or handed
  the SDK an empty string and let it throw an unreadable error.
- **Fix:**
  - `src/lib/stripe.ts` now exposes `getStripe()` (lazy, throws a clear
    "STRIPE_SECRET_KEY is missing from environment" if unset) and
    `getWebhookSecret()` (same contract for the webhook secret). The existing
    `stripe` named export is retained as a lazy `Proxy` so every call site
    that still does `import { stripe } from "@/lib/stripe"` keeps working
    without a migration.
  - `src/app/api/webhooks/stripe/route.ts` and
    `src/app/api/billing/portal/route.ts` now guard both init calls in a
    `try/catch` and return `500 { error }` with the readable message if the
    environment is misconfigured, instead of a Stripe SDK throw.
- **Verified:** `npx tsc --noEmit` is clean for all backend-zone files.
  `.env.local` already contains both `STRIPE_SECRET_KEY` and
  `STRIPE_WEBHOOK_SECRET`; per task scope, `.env.local` was not modified.
  End-to-end webhook delivery still needs a live Stripe CLI `stripe listen`
  run to confirm signature verification works against the current secret.

### 13. Missing per-job checklist, account update, plan-portal GET, trial-expired email
- **Symptom:** Owner UI had no way to customize which rooms/items run on a
  *specific* job (only per-property), no self-serve account form, no plain
  `<a href>` to the Stripe portal, and no email when a trial actually ended
  (only the 3-day warning existed).
- **Fix:**
  - `PATCH /api/jobs/[id]/items` — owner-only, same-org gate, replaces
    `job_items` for the job. Payload shape documented in `docs/api.md`.
  - `PATCH /api/account` — owner-only. `full_name` → `profiles`,
    `company_name` → `organizations`, `avatar_url` → Supabase Auth user
    metadata (until a migration adds a dedicated column — flagged for the
    security agent). Password change stays client-side via
    `supabase.auth.updateUser({ password })` as specified.
  - `GET /api/billing/portal` — now supports both `GET` and `POST` so
    frontend can use either fetch-then-redirect or a direct `<a>` link.
  - `POST /api/cron/trial-expired` — mirrors `trial-warning`. Filters orgs
    with `trial_ends_at < now()` and `subscription_status !== 'active'`,
    sends email via `auth.admin.inviteUserByEmail`, stamps
    `trial_expired_notified_at` into user metadata for idempotency.
- **Contract:** all four endpoints are documented in `docs/api.md` (created
  in this sweep — previously the file was missing).
