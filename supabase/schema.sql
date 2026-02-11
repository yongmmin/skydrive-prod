-- SkyDrive leaderboard schema
create table if not exists public.scores (
  id bigserial primary key,
  anon_id text not null,
  score integer not null check (score >= 0 and score <= 50000),
  created_at timestamptz not null default now()
);

create index if not exists scores_rank_idx
on public.scores (score desc, created_at desc);
