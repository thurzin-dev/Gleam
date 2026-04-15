-- ============================================================
-- Prevent role escalation on profiles
-- ============================================================
-- 001 exposed a critical vulnerability:
--
--   create policy "users can update their own profile"
--     on profiles for update
--     using (id = auth.uid())
--     with check (org_id = auth_org_id());
--
-- WITH CHECK only constrains org_id — a cleaner can issue:
--   update profiles set role = 'owner' where id = auth.uid();
-- and silently promote themselves, gaining owner-only DB rights
-- (insert/update/delete on properties, templates, jobs) plus the
-- ability to invite new cleaners. Cross-tenant isolation stays
-- intact, but tenant-internal privilege separation collapses.
--
-- Postgres RLS can't pin specific columns in WITH CHECK. The same
-- pattern used for the `jobs` cleaner policy (trigger enforcement)
-- applies here: block any change to `role`, `id`, or `org_id` from
-- a non-service-role caller.
-- ============================================================

create or replace function enforce_profile_update_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null when the caller is service_role (admin client).
  -- The admin client legitimately creates/modifies profiles during
  -- signup and invite flows — let those through unchecked.
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'profiles.id is immutable';
  end if;

  if new.org_id is distinct from old.org_id then
    raise exception 'profiles.org_id cannot be changed by the user';
  end if;

  if new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed by the user';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_update_fields on profiles;
create trigger trg_enforce_profile_update_fields
  before update on profiles
  for each row
  execute function enforce_profile_update_fields();
