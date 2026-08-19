-- Global interest-prompt reveal timing (fraction of video duration).
-- Admin-editable from Experiment config; applies to all communities.

insert into platform_settings (key, value) values
  ('interest_prompt_reveal_fraction', '0.3');
