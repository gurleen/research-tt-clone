update videos
set video_type = 'control', community = null, source_type = null
where source_type = 'control';

alter table videos drop constraint ingroup_has_condition;

alter table videos add constraint video_type_fields check (
  (video_type = 'ingroup' and community is not null
    and source_type in ('micro_influencer', 'institutional'))
  or (video_type = 'filler' and community is null and source_type is null)
  or (video_type = 'control' and community is null and source_type is null)
);
