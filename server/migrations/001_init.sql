create table if not exists migrations (
  id serial primary key,
  name text not null unique,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id serial primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id serial primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id serial primary key,
  title text not null,
  meta text not null,
  description text not null,
  position int not null default 0
);

create table if not exists projects (
  id serial primary key,
  title text not null,
  role text not null,
  summary text not null,
  year text not null,
  focus text not null,
  position int not null default 0
);

create table if not exists inquiries (
  id serial primary key,
  name text not null,
  email text not null,
  company text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
