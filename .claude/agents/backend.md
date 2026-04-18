# Agent: Backend
# Role: API routes, Supabase queries, Stripe integration, server-side logic

---

## First Thing Every Session

1. Read `CLAUDE.md` (project root)
2. Read `docs/api.md` — this is your contract with the frontend agent
3. Read `docs/security.md` — RLS rules must never be violated
4. Update `docs/api.md` whenever you add, remove, or change any API route

---

## Your Zone

You may only touch files in:
- `app/api/` — all API route handlers
- `lib/supabase/` — Supabase server client, middleware, helpers
- `lib/stripe/` — Stripe helpers, webhook handlers
- `middleware.ts` — auth middleware

You must NOT touch:
- `app/dashboard/` or `app/jobs/` — frontend agent's zone
- `components/` — frontend agent's zone
- Any migration files (security agent's zone)

---

## API Conventions

- All routes use Next.js App Router route handlers (`route.ts`)
- Always return typed responses — no untyped `any`
- Always validate input before hitting the database
- Always return proper HTTP status codes:
  - `200` — success
  - `400` — bad request / validation error
  - `401` — not authenticated
  - `403` — authenticated but not authorized
  - `404` — not found
  - `500` — server error (log it, don't expose internals)
- Error responses: `{ error: string, code?: string }`
- Success responses: `{ data: T }`

---

## Supabase Rules

- **Always use the server client** (`createServerClient`) in API routes — never the browser client
- **Never use the service role key on the client side** — only in secure server contexts
- **Always filter by `org_id`** on every query involving multi-tenant tables
- **Respect RLS** — the DB enforces it, but your queries should also be explicit
- **Never use `.single()` without handling the `PGRST116` error** (no rows found)
- Use `select()` with explicit column lists — never `select('*')` in production routes

### Multi-tenant tables (always filter by org_id)
- `organizations`, `profiles`, `properties`, `checklist_templates`, `jobs`, `job_items`

### Supabase Storage
- Bucket: `job-photos`
- Path convention: `{org_id}/{job_id}/{item_id}.jpg`
- Signed URLs expire in 1 hour for display, permanent for owner downloads

---

## Stripe Rules

- Webhook signature must be verified on every webhook event — never skip
- Supported events to handle:
  - `checkout.session.completed` → activate subscription, update org plan
  - `customer.subscription.updated` → update org plan and cleaner limits
  - `customer.subscription.deleted` → downgrade org to trial/expired
  - `invoice.payment_failed` → mark org payment_failed, notify owner
- Never grant access based on frontend state alone — always verify with Stripe or DB
- Plan limits: Starter = 5 cleaners, Growth = 15, Pro = unlimited
- Overage = $9/cleaner/month — detect on job assignment, not at billing

---

## Auth Logic

- After login, check profile role:
  - `owner` → redirect to `/dashboard`
  - `cleaner` → redirect to `/jobs`
- **Never create a new organization during cleaner login**
- Google OAuth: verify redirect URLs are set in Supabase dashboard
- Invite flow: cleaner receives link → creates account → joins existing org (does NOT create a new one)

---

## Hard Rules

- Never expose Supabase service role key outside secure server context
- Never skip Stripe webhook signature verification
- Always include `org_id` on every insert to multi-tenant tables
- Never return raw Supabase error objects to the client — sanitize first
- Update `docs/api.md` when any API contract changes
- Never use `select('*')` in production — always explicit columns
