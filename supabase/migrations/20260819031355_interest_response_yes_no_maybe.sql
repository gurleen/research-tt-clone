-- Interest-prompt answers are yes / no / maybe (fillers expose maybe;
-- stimulus topic prompts still send only yes or no).

alter table evt_interest_response
  alter column response type text
  using case when response then 'yes' else 'no' end;

alter table evt_interest_response
  add constraint evt_interest_response_response_check
  check (response in ('yes', 'no', 'maybe'));
