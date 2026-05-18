alter table public.users
  add column if not exists username varchar,
  add column if not exists bio text,
  add column if not exists primary_location text;

create unique index if not exists users_username_unique
  on public.users (lower(username))
  where username is not null and username <> '';
