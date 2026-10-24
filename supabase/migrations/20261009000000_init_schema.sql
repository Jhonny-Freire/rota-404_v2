-- Rota 404: schema (idempotente).
-- Colunas, tipos, nulabilidade, defaults e chaves estrangeiras espelham o banco em produção
-- (introspecção da API REST do Supabase). Unique, check e "on delete" não aparecem na introspecção
-- e seguem as regras do domínio. gen_random_uuid() é nativo do PostgreSQL 13+ (sem extensão).
-- Catálogo (age_ranges, galaxies, planetary_systems, planets, lessons, labs) recebe seed;
-- usuários e gamificação são estrutura futura.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Catálogo

create table if not exists public.age_ranges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_age integer not null check (min_age >= 0),
  max_age integer,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint age_ranges_max_age_check check (max_age is null or max_age >= min_age)
);

create table if not exists public.galaxies (
  id uuid primary key default gen_random_uuid(),
  age_range_id uuid not null references public.age_ranges (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  order_index integer not null default 0,
  sprite_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists galaxies_age_range_id_idx on public.galaxies (age_range_id);

create table if not exists public.planetary_systems (
  id uuid primary key default gen_random_uuid(),
  galaxy_id uuid not null references public.galaxies (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  order_index integer not null default 0,
  sprite_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planetary_systems_galaxy_id_idx on public.planetary_systems (galaxy_id);

create table if not exists public.planets (
  id uuid primary key default gen_random_uuid(),
  planetary_system_id uuid not null references public.planetary_systems (id) on delete cascade,
  name text not null,
  slug text not null unique,
  kind text not null check (kind in ('lesson', 'lab')),
  order_index integer not null default 0,
  sprite_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists planets_planetary_system_id_idx on public.planets (planetary_system_id);

-- content: {"code": "1.1", "engine": "<slug do motor>", "central_idea": "..."}
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid not null unique references public.planets (id) on delete cascade,
  title text not null,
  slug text not null unique,
  order_index integer not null default 0,
  content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- config: {"code": "1.3", "type": "montagem", "engine": "<slug do motor>"}
create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  planet_id uuid not null unique references public.planets (id) on delete cascade,
  title text not null,
  slug text not null unique,
  order_index integer not null default 0,
  max_score integer not null default 0 check (max_score >= 0),
  config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Estrutura futura: usuários e gamificação

create table if not exists public.avatars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sprite_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  age_range_id uuid references public.age_ranges (id) on delete set null,
  avatar_id uuid references public.avatars (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  avatar_key text,
  token_hash text,
  last_seen_at timestamptz
);

create index if not exists users_age_range_id_idx on public.users (age_range_id);
create index if not exists users_avatar_id_idx on public.users (avatar_id);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'locked'
    check (status in ('locked', 'available', 'in_progress', 'completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_progress_user_id_idx on public.user_progress (user_id);
create index if not exists user_progress_entity_idx on public.user_progress (entity_type, entity_id);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  galaxy_id uuid not null references public.galaxies (id) on delete cascade,
  planetary_system_id uuid references public.planetary_systems (id) on delete cascade,
  lab_id uuid references public.labs (id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scores_user_id_idx on public.scores (user_id);
create index if not exists scores_galaxy_id_idx on public.scores (galaxy_id);
create index if not exists scores_planetary_system_id_idx on public.scores (planetary_system_id);
create index if not exists scores_lab_id_idx on public.scores (lab_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sprite_key text,
  criteria jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_achievements_user_achievement_key unique (user_id, achievement_id)
);

create index if not exists user_achievements_achievement_id_idx on public.user_achievements (achievement_id);

-- updated_at automático

drop trigger if exists set_updated_at on public.age_ranges;
create trigger set_updated_at before update on public.age_ranges
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.galaxies;
create trigger set_updated_at before update on public.galaxies
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.planetary_systems;
create trigger set_updated_at before update on public.planetary_systems
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.planets;
create trigger set_updated_at before update on public.planets
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.lessons;
create trigger set_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.labs;
create trigger set_updated_at before update on public.labs
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.avatars;
create trigger set_updated_at before update on public.avatars
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.user_progress;
create trigger set_updated_at before update on public.user_progress
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.scores;
create trigger set_updated_at before update on public.scores
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.achievements;
create trigger set_updated_at before update on public.achievements
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.user_achievements;
create trigger set_updated_at before update on public.user_achievements
  for each row execute function public.set_updated_at();

-- Row Level Security: o backend usa a chave service_role (ignora RLS).

alter table public.age_ranges enable row level security;
alter table public.galaxies enable row level security;
alter table public.planetary_systems enable row level security;
alter table public.planets enable row level security;
alter table public.lessons enable row level security;
alter table public.labs enable row level security;
alter table public.avatars enable row level security;
alter table public.users enable row level security;
alter table public.user_progress enable row level security;
alter table public.scores enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Leitura pública somente nas tabelas de catálogo; tabelas de usuário ficam sem policy pública.

drop policy if exists catalog_public_read on public.age_ranges;
create policy catalog_public_read on public.age_ranges
  for select to anon, authenticated using (true);

drop policy if exists catalog_public_read on public.galaxies;
create policy catalog_public_read on public.galaxies
  for select to anon, authenticated using (true);

drop policy if exists catalog_public_read on public.planetary_systems;
create policy catalog_public_read on public.planetary_systems
  for select to anon, authenticated using (true);

drop policy if exists catalog_public_read on public.planets;
create policy catalog_public_read on public.planets
  for select to anon, authenticated using (true);

drop policy if exists catalog_public_read on public.lessons;
create policy catalog_public_read on public.lessons
  for select to anon, authenticated using (true);

drop policy if exists catalog_public_read on public.labs;
create policy catalog_public_read on public.labs
  for select to anon, authenticated using (true);

drop policy if exists catalog_public_read on public.achievements;
create policy catalog_public_read on public.achievements
  for select to anon, authenticated using (true);

drop policy if exists catalog_public_read on public.avatars;
create policy catalog_public_read on public.avatars
  for select to anon, authenticated using (true);

-- Privilégios explícitos (não dependem dos default privileges do projeto).

revoke all on table
  public.age_ranges, public.galaxies, public.planetary_systems, public.planets,
  public.lessons, public.labs, public.avatars, public.users, public.user_progress,
  public.scores, public.achievements, public.user_achievements
  from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.age_ranges, public.galaxies, public.planetary_systems, public.planets,
  public.lessons, public.labs, public.achievements, public.avatars
  to anon, authenticated;

grant select, insert, update, delete on table
  public.age_ranges, public.galaxies, public.planetary_systems, public.planets,
  public.lessons, public.labs, public.avatars, public.users, public.user_progress,
  public.scores, public.achievements, public.user_achievements
  to service_role;
