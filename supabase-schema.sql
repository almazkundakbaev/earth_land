-- Run this file in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.land_projects (
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
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.land_projects add column if not exists address text not null default '';
alter table public.land_projects add column if not exists status text not null default '';
alter table public.land_projects add column if not exists responsible text not null default '';
alter table public.land_projects add column if not exists sections jsonb not null default '[]'::jsonb;

create table if not exists public.land_project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.land_projects(id) on delete cascade,
  kind text not null check (kind in ('image', 'document')),
  name text not null,
  size bigint not null default 0,
  type text not null default '',
  storage_path text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists land_projects_set_updated_at on public.land_projects;
create trigger land_projects_set_updated_at
before update on public.land_projects
for each row execute function public.set_updated_at();

alter table public.land_projects enable row level security;
alter table public.land_project_files enable row level security;

drop policy if exists "authenticated users can read projects" on public.land_projects;
create policy "authenticated users can read projects"
on public.land_projects for select
to authenticated
using (true);

drop policy if exists "authenticated users can insert projects" on public.land_projects;
create policy "authenticated users can insert projects"
on public.land_projects for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "authenticated users can update projects" on public.land_projects;
create policy "authenticated users can update projects"
on public.land_projects for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated users can delete projects" on public.land_projects;
create policy "authenticated users can delete projects"
on public.land_projects for delete
to authenticated
using (true);

drop policy if exists "authenticated users can read files" on public.land_project_files;
create policy "authenticated users can read files"
on public.land_project_files for select
to authenticated
using (true);

drop policy if exists "authenticated users can insert files" on public.land_project_files;
create policy "authenticated users can insert files"
on public.land_project_files for insert
to authenticated
with check (auth.uid() = created_by);

drop policy if exists "authenticated users can delete files" on public.land_project_files;
create policy "authenticated users can delete files"
on public.land_project_files for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('land-project-files', 'land-project-files', false)
on conflict (id) do nothing;

drop policy if exists "authenticated users can read storage files" on storage.objects;
create policy "authenticated users can read storage files"
on storage.objects for select
to authenticated
using (bucket_id = 'land-project-files');

drop policy if exists "authenticated users can upload storage files" on storage.objects;
create policy "authenticated users can upload storage files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'land-project-files');

drop policy if exists "authenticated users can update storage files" on storage.objects;
create policy "authenticated users can update storage files"
on storage.objects for update
to authenticated
using (bucket_id = 'land-project-files')
with check (bucket_id = 'land-project-files');

drop policy if exists "authenticated users can delete storage files" on storage.objects;
create policy "authenticated users can delete storage files"
on storage.objects for delete
to authenticated
using (bucket_id = 'land-project-files');
