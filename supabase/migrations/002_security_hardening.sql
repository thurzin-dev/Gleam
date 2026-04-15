-- ============================================================
-- Security Hardening — agent-security audit
-- ============================================================
-- Fixes found during security review of 001_initial_schema.sql:
--
-- 1. auth_org_id() helper: add schema qualification to avoid
--    search_path injection. A malicious extension or schema could
--    shadow `profiles` if the function resolves names at call time.
--
-- 2. Storage policies: 001 left a gap — no SELECT policy for
--    authenticated users on their own org's photos. Anyone with
--    a valid session could read any org's photos via the public
--    bucket URL (no RLS on SELECT).
--
-- 3. cleaners can update jobs policy: the WITH CHECK allowed a
--    cleaner to change *any* field (including assigned_to, property_id)
--    on their assigned jobs. Tighten to status-only at the DB level.
-- ============================================================

-- ── 1. Harden auth_org_id() with explicit search path ────────
-- Without SET search_path = public, the function could resolve
-- `profiles` from a different schema if an attacker can create
-- objects in the session's search_path.
create or replace function auth_org_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select org_id from profiles where id = auth.uid()
$$;


-- ── 2. Tighten the public photo SELECT policy ─────────────────
-- 001 created: "public can read job photos" — using (bucket_id = 'job-photos')
-- This allows ANY unauthenticated visitor to list and read every photo
-- across all organizations. Since photos may contain sensitive property
-- information, restrict SELECT to authenticated members of the owning org.
drop policy if exists "public can read job photos" on storage.objects;

create policy "org members can read their own photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] = auth_org_id()::text
  );


-- ── 3. Restrict cleaner job updates to status field only ──────
-- The previous "cleaners can update their assigned jobs" policy had no
-- WITH CHECK column restriction — a cleaner could re-assign the job to
-- another user, change the property, or change the scheduled_date.
-- Postgres RLS can't restrict individual columns in WITH CHECK, but we
-- can add a tight application-enforced constraint via a trigger.
--
-- The policy still allows UPDATE on all columns, but the trigger below
-- enforces that cleaners may only change `status`.
create or replace function enforce_cleaner_update_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  select role into caller_role from profiles where id = auth.uid();

  -- Owners may update any field — no restriction.
  if caller_role = 'owner' then
    return new;
  end if;

  -- Cleaners may only change status.
  if (
    new.org_id           is distinct from old.org_id           or
    new.property_id      is distinct from old.property_id      or
    new.assigned_to      is distinct from old.assigned_to      or
    new.checklist_template_id is distinct from old.checklist_template_id or
    new.scheduled_date   is distinct from old.scheduled_date
  ) then
    raise exception 'Cleaners may only update job status';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_cleaner_update_fields on jobs;
create trigger trg_enforce_cleaner_update_fields
  before update on jobs
  for each row
  execute function enforce_cleaner_update_fields();
