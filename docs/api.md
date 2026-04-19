# Gleam — API Contracts

> Owned by the backend agent. Frontend agents must read this file before
> writing any data-fetching code. Every new or changed endpoint must be
> documented here **before** implementation.

All routes are Next.js 16 App Router route handlers under `src/app/api/`.

## Response shape

- Success: `{ data?: T, ...fields } | { received: true } | { url: string }`
- Error:   `{ error: string, code?: string }`

## Status codes

| Code | Meaning                                  |
|------|------------------------------------------|
| 200  | success                                  |
| 400  | bad request / validation error           |
| 401  | not authenticated                        |
| 403  | authenticated but not authorized         |
| 404  | not found                                |
| 500  | server error (sanitized, never internals)|

---

## Billing

### `POST /api/billing/checkout`

Create a Stripe Checkout session for a plan.

**Auth:** authenticated, role `owner`.

**Body:**
```json
{ "plan": "starter" | "growth" | "pro", "interval": "month" | "year" }
```

**Response:** `{ "url": string }` — redirect the browser here.

Errors: `401` unauthenticated, `403` non-owner, `400` invalid plan,
`404` organization not found.

### `POST /api/billing/portal`
### `GET  /api/billing/portal`

Generate a Stripe Customer Portal session. Both verbs return the same
payload so the frontend can either `fetch("…", { method: "POST" })` and read
the URL, or simply redirect with a `<a href="…">`.

**Auth:** authenticated. Any role in the caller's org can open the portal.

**Body / Query:** none.

**Response:** `{ "url": string }`.

Errors: `401` unauthenticated, `404` profile missing, `400` org has no
`stripe_customer_id` (has never checked out).

---

## Jobs

### `PATCH /api/jobs/[id]/items`

Replace a job's per-job checklist. Lets the owner customize which rooms and
tasks the assigned cleaner will tick off for this specific job, independent
of the property's default template. Existing `job_items` for the job are
deleted and re-inserted from the payload.

**Auth:** authenticated, role `owner`, job must belong to caller's org.

**Body:**
```json
{
  "rooms": [
    {
      "name": "Kitchen",
      "items": [
        { "label": "Wipe counters" },
        { "label": "Clean sink" }
      ]
    }
  ]
}
```

Each item is inserted with:
- `org_id` — caller's org
- `job_id` — from route param
- `label` — `"{room.name} — {item.label}"` (matches existing seeding convention in `actions/jobs.ts::createJob`)
- `checked: false`
- `photo_url: null`

**Response:** `{ "data": { "inserted": number } }`.

Errors: `400` invalid payload, `401` unauthenticated, `403` non-owner or
cross-org, `404` job not found.

---

## Cron (server-to-server)

All cron endpoints require `Authorization: Bearer $CRON_SECRET`.

### `POST /api/cron/trial-warning`
Sends a nudge to owners whose trial ends within the next 3 days. Uses
`supabase.auth.admin.inviteUserByEmail` as a lightweight email channel.

### `POST /api/cron/trial-expired`
Sends the "Your Gleam trial has ended" email to owners whose
`trial_ends_at < now()` AND `subscription_status !== "active"`. Idempotent:
marks `organizations.trial_expiry_notified_at` (nullable) the first time it
fires per org — subsequent runs skip already-notified orgs. If that column
does not exist yet, the route skips the idempotency guard and every matching
org is notified on each run (flagged for security agent in `docs/bugs.md`).

Email body references `/billing` for plan selection.

**Response:** `{ "sent": number }`.

### `POST /api/cron/overage`
For each active-subscription org, count cleaners over their plan limit and
create a Stripe invoice item at `$9/cleaner/month`.

---

## Webhooks

### `POST /api/webhooks/stripe`

Stripe webhook handler. Verifies the `stripe-signature` header against
`STRIPE_WEBHOOK_SECRET`. Supported events:

| Event                                | Effect                                                           |
|--------------------------------------|------------------------------------------------------------------|
| `customer.subscription.created`      | set `plan`, `subscription_status="active"`, store subscription id |
| `customer.subscription.updated`      | same as created                                                  |
| `customer.subscription.deleted`      | `subscription_status="canceled"`, `plan="trial"`                |
| `invoice.payment_failed`             | `subscription_status="past_due"`                                |

**Config:** reads `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` from
environment. Both are required; the route returns `500` with a clear error
if either is missing (instead of the opaque Stripe SDK error).

**Response:** `{ "received": true }` on success.

Errors: `400` missing/invalid signature, `500` env misconfiguration.

---

## Account

### `PATCH /api/account`

Owner-only update to the caller's profile and organization in one call.

**Auth:** authenticated, role `owner`.

**Body (all fields optional, at least one required):**
```json
{
  "full_name": "Jane Doe",
  "avatar_url": "https://…",
  "company_name": "Acme Cleaning Co."
}
```

- `full_name` → `profiles.full_name`
- `company_name` → `organizations.name`
- `avatar_url` → stored in Supabase Auth user metadata
  (`auth.users.raw_user_meta_data.avatar_url`). The `profiles` schema has
  no `avatar_url` column yet; a migration will add it later (flagged for
  security agent). Frontend should read it from `user.user_metadata.avatar_url`.

**Response:** `{ "data": { "full_name": string | null, "company_name": string | null, "avatar_url": string | null } }`.

Errors: `400` no fields provided / invalid input, `401` unauthenticated,
`403` non-owner, `404` profile/org missing.

### Password change (no API route — client-side)

Frontend calls `supabase.auth.updateUser({ password })` from a
client component with an active session. Requires the user to have signed
in recently (Supabase enforces re-auth for password changes).

---

## Auth callback (reference)

Not an API route, but documented for cross-agent awareness:
`/auth/callback?code=…&next=…` is a server route handler that exchanges an
OAuth/verification code for a session, bootstraps `organizations` +
`profiles` on first verified owner sign-in, and refuses to bootstrap a
profile when `intended_role !== "owner"`. See `docs/security.md`.
