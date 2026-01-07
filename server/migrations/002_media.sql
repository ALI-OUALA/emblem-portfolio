create table if not exists media (
  id serial primary key,
  filename text not null,
  original_name text not null,
  mime text not null,
  size int not null,
  created_at timestamptz not null default now()
);
