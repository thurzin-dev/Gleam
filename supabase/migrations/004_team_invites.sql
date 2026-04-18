-- ============================================================
-- Gleam QC — Team invites (token-based cleaner onboarding)
-- ============================================================
-- An owner generates a single-use token. The /auth/invite/[token]
-- page validates it, signs the user up, and creates a cleaner
-- profile under the OWNING org_id — never a new organization.
-- ============================================================

create table if not exists team_invites (
  id          uuid primary key default uuid_generate_v4(),
  token       text not null unique,
  org_id      uuid not null references organizations(id) on delete cascade,
  email       text,
  created_by  uuid not null references profiles(id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  used_at     timestamptz,
  used_by     uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists team_invites_org_id_idx on team_invites (org_id);
create index if not exists team_invites_token_idx  on team_invites (token);

alter table team_invites enable row level security;

-- Owners can view invites for their org
create policy "owners view org invites"
  on team_invites for select
  using (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

-- Owners can create invites for their org
create policy "owners create org invites"
  on team_invites for insert
  with check (
    org_id = auth_org_id()
    and created_by = auth.uid()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

-- Owners can revoke (delete) invites for their org
create policy "owners delete org invites"
  on team_invites for delete
  using (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

-- Token lookup + acceptance happens via a SECURITY DEFINER server
-- action that uses the service role; no public select policy is needed.
