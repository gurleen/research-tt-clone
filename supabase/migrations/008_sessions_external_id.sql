-- Qualtrics ResponseID join token. Nullable so staging /admin/test-session
-- can mint sessions without a recruitment token. Unique so one session per
-- token. Do not name this cint_id. Postgres unique allows multiple NULLs.

alter table sessions
  add column external_id text;

alter table sessions
  add constraint sessions_external_id_key unique (external_id);

comment on column sessions.external_id is
  'Anonymous Qualtrics ResponseID join token. Not a Cint panel ID.';
