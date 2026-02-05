alter table sessions
  add column if not exists csrf_token text;

create index if not exists sessions_expires_at_idx on sessions (expires_at);
