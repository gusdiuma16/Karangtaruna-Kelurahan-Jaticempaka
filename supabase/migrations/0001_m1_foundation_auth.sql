-- Milestone M1: Database & Auth Foundation
-- Ecosystem: Karang Taruna Kelurahan Jaticempaka (Kelurahan, Unit, Sub Unit)
-- Domain Guard: No RT/RW/Kelurahan government administration modules.
-- Decision Note: No in-app notifications table; membership confirmation routes directly to WhatsApp.

create extension if not exists pgcrypto;

-- 1. Enums
do $$ begin
  create type public.organization_level as enum ('kelurahan', 'unit', 'sub_unit');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.organization_status as enum ('pending', 'active', 'suspended', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.profile_status as enum ('active', 'suspended');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.platform_role_code as enum ('platform_super_admin', 'platform_support');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.whatsapp_routing_mode as enum ('org_pic', 'central_gateway');
exception
  when duplicate_object then null;
end $$;

-- 2. Shared timestamp trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Ecosystems table (root scope + 1-pintu WhatsApp fallback config)
create table if not exists public.ecosystems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  central_whatsapp_e164 text,
  central_whatsapp_label text not null default 'Sekretariat 1 Pintu Karang Taruna Jaticempaka',
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_ecosystems_updated_at on public.ecosystems;
create trigger trg_ecosystems_updated_at
  before update on public.ecosystems
  for each row
  execute function public.set_updated_at();

-- 4. Organizations table (Karang Taruna Kelurahan / Unit / Sub Unit only)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid not null references public.ecosystems(id) on delete restrict,
  parent_organization_id uuid references public.organizations(id) on delete restrict,
  org_level public.organization_level not null,
  name text not null,
  slug text not null unique,
  status public.organization_status not null default 'pending',
  area_label text,
  whatsapp_pic_name text,
  whatsapp_pic_position text,
  whatsapp_e164 text,
  whatsapp_routing_mode public.whatsapp_routing_mode not null default 'org_pic',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_organizations_no_self_parent
    check (parent_organization_id is null or parent_organization_id <> id)
);

create index if not exists idx_organizations_ecosystem_status
  on public.organizations (ecosystem_id, status);
create index if not exists idx_organizations_parent
  on public.organizations (parent_organization_id);
create index if not exists idx_organizations_slug
  on public.organizations (slug);

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

-- 5. Profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  display_name text,
  avatar_url text,
  phone_e164 text,
  address_rw text,
  status public.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 6. Platform-level roles (strictly separated from org roles)
create table if not exists public.platform_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_code public.platform_role_code not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role_code)
);

create index if not exists idx_platform_role_assignments_user
  on public.platform_role_assignments (user_id);

-- 7. Audit logs (append-only via database triggers / server)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  ecosystem_id uuid references public.ecosystems(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_org_created
  on public.audit_logs (organization_id, created_at desc);
create index if not exists idx_audit_logs_actor_created
  on public.audit_logs (actor_user_id, created_at desc);
create index if not exists idx_audit_logs_entity
  on public.audit_logs (entity_type, entity_id);

-- 8. Security helper: check platform admin without recursive RLS loops
create or replace function public.is_platform_admin(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_role_assignments pra
    where pra.user_id = target_user_id
      and pra.role_code = 'platform_super_admin'
  );
$$;

-- 9. Trigger: auto-create profile on Supabase Auth signup + write audit log
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Anggota Karang Taruna'
  );

  insert into public.profiles (id, full_name, display_name, address_rw)
  values (
    new.id,
    v_full_name,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'address_rw'), '')
  )
  on conflict (id) do nothing;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    new.id,
    'profile.created',
    'profiles',
    new.id,
    jsonb_build_object('source', 'auth.signup')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 10. Trigger: block self-service profile status tampering + audit profile updates
create or replace function public.guard_and_audit_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if auth.uid() is not null and not public.is_platform_admin(auth.uid()) then
      raise exception 'Forbidden: profile status cannot be modified by user';
    end if;
  end if;

  if (
    new.full_name is distinct from old.full_name
    or new.display_name is distinct from old.display_name
    or new.phone_e164 is distinct from old.phone_e164
    or new.address_rw is distinct from old.address_rw
    or new.status is distinct from old.status
  ) then
    insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    values (
      coalesce(auth.uid(), new.id),
      'profile.updated',
      'profiles',
      new.id,
      jsonb_build_object(
        'changed_status', new.status is distinct from old.status,
        'changed_name', new.full_name is distinct from old.full_name
      )
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_and_audit_profile_update on public.profiles;
create trigger trg_guard_and_audit_profile_update
  before update on public.profiles
  for each row
  execute function public.guard_and_audit_profile_update();

-- 11. Row Level Security (Deny by Default)
alter table public.ecosystems enable row level security;
alter table public.ecosystems force row level security;

alter table public.organizations enable row level security;
alter table public.organizations force row level security;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.platform_role_assignments enable row level security;
alter table public.platform_role_assignments force row level security;

alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

-- Ecosystems: public read for active ecosystem metadata only
drop policy if exists ecosystems_select_active on public.ecosystems;
create policy ecosystems_select_active
  on public.ecosystems
  for select
  to anon, authenticated
  using (status = 'active');

-- Organizations: public read for active organizations only (catalog & WA confirmation routing)
drop policy if exists organizations_select_active on public.organizations;
create policy organizations_select_active
  on public.organizations
  for select
  to anon, authenticated
  using (status = 'active');

-- Profiles: authenticated users can read & update ONLY their own profile (or platform admin read)
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_platform_admin(auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Platform role assignments: read own roles or platform admin; no client writes
drop policy if exists platform_roles_select_own_or_admin on public.platform_role_assignments;
create policy platform_roles_select_own_or_admin
  on public.platform_role_assignments
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

-- Audit logs: read only for platform admins in M1 (org-scoped audit policies added in M3); no client writes
drop policy if exists audit_logs_select_platform_admin on public.audit_logs;
create policy audit_logs_select_platform_admin
  on public.audit_logs
  for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));
