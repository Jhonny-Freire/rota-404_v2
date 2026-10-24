-- Rota 404 — contas de aluno (apelido + senha + idade), progresso por conta e ranking.
-- Rode DEPOIS de 20261009000000_init_schema.sql (SQL Editor do Supabase). É idempotente: pode rodar de novo.
-- As tabelas users, user_progress e scores já existem; aqui só entram colunas e índices únicos.

alter table public.users add column if not exists nickname text;
-- apelido normalizado (minúsculas, sem espaços repetidos): é por ele que o login procura e que impede apelido repetido
alter table public.users add column if not exists nickname_key text;
-- "pbkdf2_sha256$<iterações>$<sal>$<hash>" (gerado no backend; a senha nunca é guardada)
alter table public.users add column if not exists password_hash text;
alter table public.users add column if not exists age integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_age_check') then
    alter table public.users add constraint users_age_check check (age is null or age between 4 and 120);
  end if;
end $$;

create unique index if not exists users_nickname_key_key on public.users (nickname_key);
-- sessão: o backend guarda só o SHA-256 do token (coluna token_hash, que já existia)
create index if not exists users_token_hash_idx on public.users (token_hash);

-- uma linha de progresso por aluno e planeta; uma pontuação (a melhor) por aluno e laboratório
create unique index if not exists user_progress_user_entity_key
  on public.user_progress (user_id, entity_type, entity_id);
create unique index if not exists scores_user_lab_key on public.scores (user_id, lab_id);
