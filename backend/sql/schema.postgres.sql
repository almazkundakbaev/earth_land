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
