create extension if not exists "pgcrypto";

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists land_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Новый участок',
  summary text not null default '',
  address text not null default '',
  status text not null default '',
  responsible text not null default '',
  region text not null default '',
  area text not null default '',
  comments text not null default '',
  lat double precision,
  lng double precision,
  area_square_meters numeric not null default 0,
  area_points jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists land_project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references land_projects(id) on delete cascade,
  kind text not null check (kind in ('image', 'document')),
  name text not null,
  size bigint not null default 0,
  type text not null default '',
  storage_path text not null,
  file_category text not null default '',
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_set_updated_at on app_users;
create trigger app_users_set_updated_at
before update on app_users
for each row execute function set_updated_at();

drop trigger if exists land_projects_set_updated_at on land_projects;
create trigger land_projects_set_updated_at
before update on land_projects
for each row execute function set_updated_at();

create table if not exists app_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists app_users
  add column if not exists profile_description text not null default '',
  add column if not exists user_role_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_users_user_role_id_fkey'
  ) then
    alter table app_users
      add constraint app_users_user_role_id_fkey
      foreign key (user_role_id) references app_roles(id) on delete set null;
  end if;
end;
$$;

alter table if exists land_projects
  add column if not exists project_key text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references app_users(id) on delete set null;

update land_projects
set project_key = 'PRJ-' || upper(substr(replace(coalesce(id::text, gen_random_uuid()::text), '-', ''), 1, 10))
where project_key is null or project_key = '';

alter table if exists land_projects
  alter column project_key set not null;

alter table if exists land_projects
  alter column project_key set default ('PRJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));

create unique index if not exists land_projects_project_key_uindex on land_projects(project_key);

drop trigger if exists app_roles_set_updated_at on app_roles;
create trigger app_roles_set_updated_at
before update on app_roles
for each row execute function set_updated_at();
