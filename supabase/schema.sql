-- Doomly v0.1 schema. Apply in Supabase SQL editor.

create table subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  exam_date date,                          -- null = no exam mode
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects on delete cascade,
  filename text not null,
  storage_path text not null,
  pages jsonb,                             -- string[] per-page text, filled on first process call
  chunks_total int,
  chunks_done int not null default 0,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects on delete cascade,
  document_id uuid not null references documents on delete cascade,
  type text not null check (type in ('concept','mcq','code_bite','exam_trap','true_false')),
  topic text not null,
  difficulty int not null check (difficulty between 1 and 5),
  payload jsonb not null,                  -- shape varies by type
  source_page int not null,                -- grounding: every card traces back to a page
  created_at timestamptz default now()
);
create index on cards (subject_id, topic, difficulty);

create table interactions (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  card_id uuid not null references cards on delete cascade,
  action text not null check (action in ('seen','correct','wrong','got_it','confused','saved')),
  dwell_ms int,
  created_at timestamptz default now()
);
create index on interactions (user_id, card_id);

-- Mastery is derived, never stored: nothing to keep in sync.
-- security_invoker so the caller's RLS applies to the underlying tables.
create view topic_mastery with (security_invoker = on) as
select i.user_id,
       c.subject_id,
       c.topic,
       count(*) filter (where i.action in ('correct','got_it')) as hits,
       count(*) filter (where i.action in ('wrong','confused'))  as misses,
       -- Laplace-smoothed: one lucky answer is not 100% mastery
       (count(*) filter (where i.action in ('correct','got_it')) + 1.0)
       / (count(*) filter (where i.action in ('correct','got_it','wrong','confused')) + 2.0) as score
from interactions i
join cards c on c.id = i.card_id
group by 1, 2, 3;

-- ---------------------------------------------------------------- RLS
-- Multi-user: every table is a trust boundary. No exceptions.

alter table subjects     enable row level security;
alter table documents    enable row level security;
alter table cards        enable row level security;
alter table interactions enable row level security;

create policy own_subjects on subjects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy own_documents on documents
  for all using (exists (select 1 from subjects s where s.id = subject_id and s.user_id = auth.uid()))
  with check  (exists (select 1 from subjects s where s.id = subject_id and s.user_id = auth.uid()));

create policy own_cards on cards
  for all using (exists (select 1 from subjects s where s.id = subject_id and s.user_id = auth.uid()))
  with check  (exists (select 1 from subjects s where s.id = subject_id and s.user_id = auth.uid()));

create policy own_interactions on interactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Storage: bucket 'docs', each user confined to a folder named by their uid.
insert into storage.buckets (id, name, public) values ('docs', 'docs', false)
  on conflict (id) do nothing;

create policy own_files on storage.objects
  for all using (bucket_id = 'docs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check  (bucket_id = 'docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- feed engine
-- The whole recommender. Ordering only: weakest topic first, difficulty tracking
-- mastery, type mix shifted by how close the exam is.
create or replace function next_cards(p_subject_ids uuid[], p_limit int default 40)
returns setof cards
language sql stable
as $$
  with m as (
    select topic, subject_id, score from topic_mastery where user_id = auth.uid()
  ),
  band as (
    select s.id as subject_id,
           case
             when s.exam_date is null                  then 'learn'
             when s.exam_date - current_date > 14      then 'learn'
             when s.exam_date - current_date >= 3      then 'recall'
             else                                           'panic'
           end as phase
    from subjects s
    where s.id = any(p_subject_ids)
  )
  select c.*
  from cards c
  join band b on b.subject_id = c.subject_id
  left join m on m.subject_id = c.subject_id and m.topic = c.topic
  where c.subject_id = any(p_subject_ids)
    -- Crude two-band spaced repetition: a card you got wrong comes back tomorrow,
    -- a card you know stays gone for a month.
    -- ponytail: 2-band cooldown, not SM-2. Upgrade if retention data says it matters.
    and not exists (
      select 1 from interactions i
      where i.card_id = c.id and i.user_id = auth.uid()
      group by i.card_id
      having max(i.created_at) > now() - (
        case when bool_or(i.action in ('wrong','confused'))
             then interval '1 day' else interval '30 days' end)
    )
  order by
    -- Bucketed, not raw: raw score would serve 40 cards of one topic in a row.
    floor(coalesce(m.score, 0.5) * 3) asc,
    -- Progressive difficulty: aim at 1..5 scaled by mastery.
    abs(c.difficulty - (1 + coalesce(m.score, 0.5) * 4)) asc,
    -- Exam mode: reorder the format mix, don't restrict it.
    case b.phase
      when 'recall' then case when c.type in ('mcq','true_false')     then 0 else 1 end
      when 'panic'  then case when c.type in ('exam_trap','concept')  then 0 else 1 end
      else 0
    end asc,
    random()
  limit p_limit;
$$;
