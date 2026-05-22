-- ユーザーごとのカスタム写真タグ。
-- ビルトイン (park / food / landscape) はアプリ側の定数として持ち、ここには保存しない。

create table if not exists public.user_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (user_id, tag)
);

create index if not exists idx_user_tags_user_id on public.user_tags(user_id);

alter table public.user_tags enable row level security;

drop policy if exists "user_tags_select_own" on public.user_tags;
create policy "user_tags_select_own"
on public.user_tags for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_tags_insert_own" on public.user_tags;
create policy "user_tags_insert_own"
on public.user_tags for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_tags_delete_own" on public.user_tags;
create policy "user_tags_delete_own"
on public.user_tags for delete
to authenticated
using (auth.uid() = user_id);

comment on table public.user_tags is 'per-user custom photo tags (defaults park/food/landscape are not stored here).';
