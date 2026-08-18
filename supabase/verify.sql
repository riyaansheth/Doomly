-- Diagnostic for the feed ranking. Run in the Supabase SQL editor while signed
-- in as yourself, AFTER scrolling a bit and getting some cards deliberately wrong.
--
-- What you're checking: topics you're weak at should sit at the TOP of the feed,
-- and difficulty should track mastery rather than jumping straight to level 5.
with feed as (
  select row_number() over () as position, id, topic, type, difficulty
  from next_cards(array(select id from subjects), 40)
)
select f.position, f.topic, f.type, f.difficulty,
       round(coalesce(m.score, 0.5)::numeric, 2) as mastery
from feed f
left join topic_mastery m
  on m.topic = f.topic and m.user_id = auth.uid()
order by f.position;

-- Expect: low mastery near position 1, high mastery near position 40.
-- If mastery looks random down the column, the ordering in next_cards() is broken.
