-- Enable required extensions
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- users
create table if not exists public.users (
  -- NextAuth を主認証として使うため、auth.users への外部キーは貼らない（Google の sub 等がUUIDではないため）
  id uuid primary key,
  email varchar not null unique,
  display_name varchar,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- spots
create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  location geometry(point, 4326) not null,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_spots_location_gist on public.spots using gist (location);

-- Helper view for PostgREST: expose location as WKT
create or replace view public.spots_with_location as
select
  id,
  name,
  address,
  created_at,
  location,
  st_astext(location) as location_wkt
from public.spots;

-- Ensure RLS is respected when selecting the view (Postgres 15+)
alter view public.spots_with_location set (security_invoker = true);

-- photos
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  spot_id uuid not null references public.spots(id) on delete cascade,
  storage_url text not null,
  thumbnail_url text,
  is_public boolean not null default true,
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  exif_lat double precision,
  exif_lng double precision
);

create index if not exists idx_photos_spot_id on public.photos(spot_id);
create index if not exists idx_photos_user_id on public.photos(user_id);
create index if not exists idx_photos_is_public on public.photos(is_public);

-- PostGIS helper: find nearby spot by lat/lng within radius meters
create or replace function public.find_nearby_spot(
  lat double precision,
  lng double precision,
  radius_meters double precision default 50
)
returns table (
  id uuid,
  name varchar,
  address text,
  location geometry(point, 4326),
  distance_meters double precision
)
language sql
stable
as $$
  select
    s.id,
    s.name,
    s.address,
    s.location,
    st_distance(
      s.location::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography
    ) as distance_meters
  from public.spots s
  where st_dwithin(
    s.location::geography,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters asc
  limit 1;
$$;

-- Helper: get spots within bounds (avoid PostgREST spatial filter parsing issues)
create or replace function public.get_spots_in_bounds(
  south double precision,
  west double precision,
  north double precision,
  east double precision
)
returns table (
  id uuid,
  name varchar,
  address text,
  created_at timestamptz,
  lat double precision,
  lng double precision,
  location_wkt text
)
language sql
stable
as $$
  select
    s.id,
    s.name,
    s.address,
    s.created_at,
    st_y(s.location::geometry) as lat,
    st_x(s.location::geometry) as lng,
    st_astext(s.location) as location_wkt
  from public.spots s
  where st_intersects(
    s.location,
    st_makeenvelope(west, south, east, north, 4326)
  )
  limit 500;
$$;

-- Row Level Security
alter table public.users enable row level security;
alter table public.spots enable row level security;
alter table public.photos enable row level security;

-- users: each user can read/update own row (minimal baseline)
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- spots: everyone can read, authenticated can insert
drop policy if exists "spots_select_all" on public.spots;
create policy "spots_select_all"
on public.spots for select
to anon, authenticated
using (true);

drop policy if exists "spots_insert_authenticated" on public.spots;
create policy "spots_insert_authenticated"
on public.spots for insert
to authenticated
with check (true);

-- photos: public photos are readable by everyone; owner can read own private photos
drop policy if exists "photos_select_public_or_owner" on public.photos;
create policy "photos_select_public_or_owner"
on public.photos for select
to anon, authenticated
using (is_public = true or auth.uid() = user_id);

-- photos: write only by owner
drop policy if exists "photos_insert_owner" on public.photos;
create policy "photos_insert_owner"
on public.photos for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "photos_update_owner" on public.photos;
create policy "photos_update_owner"
on public.photos for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "photos_delete_owner" on public.photos;
create policy "photos_delete_owner"
on public.photos for delete
to authenticated
using (auth.uid() = user_id);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Storage policies: users can upload/manage own objects under photos/{user_id}/...
drop policy if exists "storage_photos_select_public_or_owner" on storage.objects;
create policy "storage_photos_select_public_or_owner"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'photos'
  and (
    -- allow owner access to any own file
    auth.uid()::text = (storage.foldername(name))[1]
    -- allow public access if linked photo row is public
    or exists (
      select 1
      from public.photos p
      where p.storage_url = name
      and p.is_public = true
    )
  )
);

drop policy if exists "storage_photos_insert_owner" on storage.objects;
create policy "storage_photos_insert_owner"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "storage_photos_update_owner" on storage.objects;
create policy "storage_photos_update_owner"
on storage.objects for update
to authenticated
using (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "storage_photos_delete_owner" on storage.objects;
create policy "storage_photos_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
