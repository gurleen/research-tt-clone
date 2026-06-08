-- Soft-delete for stimulus catalog: inactive videos stay in DB for session history.
alter table videos
  add column if not exists active boolean not null default true;
