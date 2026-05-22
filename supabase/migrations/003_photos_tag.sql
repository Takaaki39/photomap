-- photos に手動タグ列を追加（公園 / 食事 / 風景 など）
-- 値は null（未タグ）または英語 slug を想定。アプリ側でバリデーションする。

alter table public.photos
  add column if not exists tag text;

create index if not exists idx_photos_tag on public.photos(tag);

comment on column public.photos.tag is 'photo tag: null (untagged) | park | food | landscape';
