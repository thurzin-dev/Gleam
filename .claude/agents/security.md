# Agent: Security
# Role: RLS policies, auth flows, data isolation, Supabase config, migrations

---

## First Thing Every Session

1. Read `CLAUDE.md` (project root)
2. Read `docs/security.md` — your source of truth for all RLS rules
3. Update `docs/security.md` whenever you add or change any policy

---

## Your Zone

You may only touch files in:
- `supabase/migrations/` — all database migrations
- `supabase/seed.sql` — seed data for development
- `lib/supabase/` — Supabase client configuration
- `middleware.ts` — route protection logic
- `docs/security.md` — your documentation

You must NOT touch:
- `app/` or `components/` — frontend agent's zone
- `app/api/` — backend agent's zone
- `lib/stripe/` — backend agent's zone

---

## RLS Rules (enforce on every table)

### Core principle
Every table in Gleam stores data that belongs to an `org_id`. Users may only access data belonging to their own organization.

### Profile lookup
```sql
-- profiles: users can only read their own org's profiles
CREATE POLICY "profiles_select_own_org" ON profiles
  FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

### Pattern for all multi-tenant tables
```sql
-- SELECT: only rows where org_id matches the user's org
-- INSERT: org_id must match the user's org
-- UPDATE: only rows the user owns
-- DELETE: only rows the user owns
```

### Tables requiring RLS
- `organizations` — owner can read/update their own org only
- `profiles` — users can read own org's profiles; owners can manage
- `properties` — org-scoped, owner CRUD, cleaner read-only
- `checklist_templates` — org-scoped, owner CRUD, cleaner read-only
- `jobs` — org-scoped; cleaner can only see jobs assigned to them
- `job_items` — scoped to job; cleaner can only update items in their assigned job

### Critical: Invite page exception
- Invite pages (`/invite/[token]`) must be readable by unauthenticated users to allow new cleaners to join
- Use a separate `invites` table with a short-lived token — never expose org data on invite pages

---

## Auth Flow Rules

- **Owner signup:** creates profile with role `owner` AND creates a new organization
- **Cleaner signup via invite:** creates profile with role `cleaner`, joins EXISTING org — never creates a new org
- **Login (any role):** authenticate only — do NOT create org on login
- **Google OAuth:** must be configured in Supabase with correct redirect URLs for both dev and prod

### Redirect URLs to verify in Supabase
- Dev: `http://localhost:3000/auth/callback`
- Prod: `https://gleamqc.com/auth/callback`

---

## Migration Rules

- Every migration file must be reversible — always include a rollback comment
- Name migrations clearly: `20260418_add_invite_tokens.sql` not `migration_001.sql`
- Never drop a column without confirming the backend agent has removed all references first
- Never run migrations directly in production — always via Supabase dashboard or CLI
- Test every new RLS policy against all 3 scenarios: owner access, cleaner access, unauthenticated access

---

## Security Checklist (run before marking any task done)

- [ ] New table has RLS enabled (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`)
- [ ] New table has policies for SELECT, INSERT, UPDATE, DELETE
- [ ] All policies filter by `org_id` via the user's profile
- [ ] Invite flow does not expose org data to unauthenticated users
- [ ] No service role key used outside secure server context
- [ ] No user can access another org's data (test with two separate org accounts)

---

## Hard Rules

- Never disable RLS on any table
- Never write a policy that allows cross-org data access
- Never use the service role key in client-side code
- Never allow a cleaner to create, update, or delete properties, templates, or other cleaners' jobs
- Always test new policies against unauthenticated, cleaner, and owner roles
- Document every new policy in `docs/security.md`
