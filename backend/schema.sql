-- Fight Random backend schema.
-- Live tables use the fr_ prefix so they remain isolated from other apps in the same Supabase project.

create table if not exists public.fr_players (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  nickname text not null check (char_length(nickname) between 2 and 18),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  matches integer not null default 0 check (matches >= 0),
  wins integer not null default 0 check (wins >= 0),
  kills integer not null default 0 check (kills >= 0),
  deaths integer not null default 0 check (deaths >= 0),
  damage bigint not null default 0 check (damage >= 0),
  rating integer not null default 1000,
  current_streak integer not null default 0,
  best_streak integer not null default 0
);

create unique index if not exists fr_players_nickname_lower_uidx on public.fr_players (lower(nickname));
create index if not exists fr_players_rating_idx on public.fr_players (rating desc, wins desc);

create table if not exists public.fr_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_player_id uuid not null references public.fr_players(id) on delete cascade,
  mode text not null check (mode in ('duel','ffa3','teams','core')),
  visibility text not null default 'public' check (visibility in ('public','private')),
  status text not null default 'waiting' check (status in ('waiting','playing','closed')),
  max_players smallint not null check (max_players between 2 and 4),
  player_count smallint not null default 1 check (player_count between 0 and 4),
  build_version text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now()
);

create index if not exists fr_rooms_lobby_idx on public.fr_rooms (status, visibility, last_heartbeat_at desc);
create index if not exists fr_rooms_host_player_idx on public.fr_rooms (host_player_id);

create table if not exists public.fr_room_members (
  room_id uuid not null references public.fr_rooms(id) on delete cascade,
  player_id uuid not null references public.fr_players(id) on delete cascade,
  seat smallint not null check (seat between 0 and 3),
  character text not null default 'mix' check (character in ('mix','trucks','lizzy')),
  joined_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, player_id)
);

create unique index if not exists fr_room_members_live_seat_uidx
  on public.fr_room_members (room_id, seat) where left_at is null;
create index if not exists fr_room_members_player_idx
  on public.fr_room_members (player_id, joined_at desc);

create table if not exists public.fr_matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.fr_rooms(id) on delete set null,
  client_match_id uuid,
  mode text not null check (mode in ('duel','ffa3','teams','core')),
  winner_player_id uuid references public.fr_players(id) on delete set null,
  winner_team smallint,
  rounds smallint not null default 0 check (rounds >= 0),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  build_version text not null default 'web',
  started_at timestamptz,
  finished_at timestamptz not null default now()
);

create unique index if not exists fr_matches_client_match_uidx
  on public.fr_matches (client_match_id) where client_match_id is not null;
create index if not exists fr_matches_finished_idx on public.fr_matches (finished_at desc);
create index if not exists fr_matches_room_idx on public.fr_matches (room_id);
create index if not exists fr_matches_winner_player_idx on public.fr_matches (winner_player_id);

create table if not exists public.fr_match_players (
  match_id uuid not null references public.fr_matches(id) on delete cascade,
  player_id uuid not null references public.fr_players(id) on delete cascade,
  seat smallint not null check (seat between 0 and 3),
  team smallint,
  character text not null check (character in ('mix','trucks','lizzy')),
  score smallint not null default 0,
  won boolean not null default false,
  kills integer not null default 0,
  deaths integer not null default 0,
  damage bigint not null default 0,
  accuracy numeric(5,2) not null default 0,
  pickups integer not null default 0,
  primary key (match_id, player_id)
);

create index if not exists fr_match_players_player_idx on public.fr_match_players (player_id, match_id);

alter table public.fr_players enable row level security;
alter table public.fr_rooms enable row level security;
alter table public.fr_room_members enable row level security;
alter table public.fr_matches enable row level security;
alter table public.fr_match_players enable row level security;

revoke all on table public.fr_players from anon, authenticated;
revoke all on table public.fr_rooms from anon, authenticated;
revoke all on table public.fr_room_members from anon, authenticated;
revoke all on table public.fr_matches from anon, authenticated;
revoke all on table public.fr_match_players from anon, authenticated;

-- The live database also contains public.fr_record_match(...), a service_role-only
-- SECURITY DEFINER function that records match results and updates persistent stats
-- transactionally. See docs/backend.md for the API contract.
