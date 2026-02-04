alter table services
  add column if not exists is_published boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table projects
  add column if not exists is_published boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update services set is_published = true where is_published is null;
update services set updated_at = now() where updated_at is null;
update projects set is_published = true where is_published is null;
update projects set updated_at = now() where updated_at is null;
