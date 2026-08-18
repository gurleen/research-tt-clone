-- Stimulus catalog fields for caption, comments, and social-stat chrome.
-- Existing RLS on videos already covers authenticated admin writes.

alter table videos
  add column caption text not null default '',
  add column like_count integer not null default 0,
  add column comment_count integer not null default 0,
  add column follower_count integer not null default 0,
  add column share_count integer not null default 0,
  add column save_count integer not null default 0,
  add column comments jsonb not null default '[]'::jsonb;

alter table videos
  add constraint videos_social_counts_nonnegative check (
    like_count >= 0
    and comment_count >= 0
    and follower_count >= 0
    and share_count >= 0
    and save_count >= 0
  ),
  add constraint videos_comments_is_array check (
    jsonb_typeof(comments) = 'array'
  );

comment on column videos.caption is
  'Overlay caption shown on the feed. Empty falls back to account_name on the client.';
comment on column videos.like_count is
  'Display baseline; participant like adds +1 in UI only.';
comment on column videos.comment_count is
  'Display baseline; may exceed the length of the comments array.';
comment on column videos.follower_count is
  'Authentic counts for ingroup accounts; varied fake counts for filler.';
comment on column videos.comments is
  'Researcher-authored comment chrome: [{ username, text, timestamp? }].';
