-- ============================================================
-- Gleam QC — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table organizations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  full_name  text not null,
  role       text not null check (role in ('owner', 'cleaner')),
  created_at timestamptz not null default now()
);

create table properties (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  address    text not null,
  created_at timestamptz not null default now()
);

create table checklist_templates (
  id         uuid primary key default uuid_generate_v4(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  items      jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table jobs (
  id                     uuid primary key default uuid_generate_v4(),
  org_id                 uuid not null references organizations(id) on delete cascade,
  property_id            uuid not null references properties(id) on delete restrict,
  assigned_to            uuid references profiles(id) on delete set null,
  checklist_template_id  uuid references checklist_templates(id) on delete set null,
  status                 text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  scheduled_date         date not null,
  created_at             timestamptz not null default now()
);

create table job_items (
  id         uuid primary key default uuid_generate_v4(),
  job_id     uuid not null references jobs(id) on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  label      text not null,
  checked    boolean not null default false,
  photo_url  text,
  notes      text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on profiles (org_id);
create index on properties (org_id);
create index on checklist_templates (org_id);
create index on jobs (org_id);
create index on jobs (assigned_to);
create index on jobs (property_id);
create index on job_items (job_id);
create index on job_items (org_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Helper: returns the caller's org_id from their profile.
-- ============================================================

alter table organizations      enable row level security;
alter table profiles           enable row level security;
alter table properties         enable row level security;
alter table checklist_templates enable row level security;
alter table jobs               enable row level security;
alter table job_items          enable row level security;

-- Reusable inline function so each policy stays readable
create or replace function auth_org_id()
returns uuid
language sql stable
security definer
as $$
  select org_id from profiles where id = auth.uid()
$$;

-- ============================================================
-- organizations
-- ============================================================

create policy "org members can view their org"
  on organizations for select
  using (id = auth_org_id());

-- ============================================================
-- profiles
-- ============================================================

create policy "members can view profiles in their org"
  on profiles for select
  using (org_id = auth_org_id());

create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (org_id = auth_org_id());

-- Inserts are handled via service role during sign-up (server action).
-- Direct inserts from authenticated users are blocked by default.

-- ============================================================
-- properties
-- ============================================================

create policy "org members can view properties"
  on properties for select
  using (org_id = auth_org_id());

create policy "owners can insert properties"
  on properties for insert
  with check (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

create policy "owners can update properties"
  on properties for update
  using (org_id = auth_org_id())
  with check (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

create policy "owners can delete properties"
  on properties for delete
  using (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

-- ============================================================
-- checklist_templates
-- ============================================================

create policy "org members can view templates"
  on checklist_templates for select
  using (org_id = auth_org_id());

create policy "owners can insert templates"
  on checklist_templates for insert
  with check (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

create policy "owners can update templates"
  on checklist_templates for update
  using (org_id = auth_org_id())
  with check (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

create policy "owners can delete templates"
  on checklist_templates for delete
  using (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

-- ============================================================
-- jobs
-- ============================================================

create policy "org members can view jobs"
  on jobs for select
  using (org_id = auth_org_id());

create policy "owners can insert jobs"
  on jobs for insert
  with check (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

create policy "owners can update any job"
  on jobs for update
  using (org_id = auth_org_id())
  with check (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

create policy "cleaners can update their assigned jobs"
  on jobs for update
  using (
    org_id = auth_org_id()
    and assigned_to = auth.uid()
  )
  with check (
    org_id = auth_org_id()
    and assigned_to = auth.uid()
    -- cleaners may only change status, enforced at app layer
  );

create policy "owners can delete jobs"
  on jobs for delete
  using (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

-- ============================================================
-- job_items
-- ============================================================

create policy "org members can view job items"
  on job_items for select
  using (org_id = auth_org_id());

create policy "owners can insert job items"
  on job_items for insert
  with check (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

create policy "org members can update job items"
  on job_items for update
  using (org_id = auth_org_id())
  with check (org_id = auth_org_id());

create policy "owners can delete job items"
  on job_items for delete
  using (
    org_id = auth_org_id()
    and (select role from profiles where id = auth.uid()) = 'owner'
  );

-- ============================================================
-- STORAGE: job-photos bucket
-- Run this in the Supabase Storage UI or via the dashboard.
-- The bucket must already exist (name: job-photos, public: true).
-- ============================================================

-- Allow org members to upload photos under their org prefix
create policy "org members can upload photos"
  on storage.objects for insert
  with check (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] = auth_org_id()::text
  );

create policy "public can read job photos"
  on storage.objects for select
  using (bucket_id = 'job-photos');

create policy "org members can delete their photos"
  on storage.objects for delete
  using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] = auth_org_id()::text
  );
