-- Rota 404 — nível de conhecimento que o aluno escolhe no cadastro (iniciante, intermediário, avançado).
-- Rode DEPOIS de 20261022000000_accounts.sql (SQL Editor do Supabase). É idempotente: pode rodar de novo.
-- Sem esta coluna o cadastro continua funcionando (o backend grava a conta sem o nível).

alter table public.users add column if not exists knowledge_level text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_knowledge_level_check') then
    alter table public.users add constraint users_knowledge_level_check
      check (knowledge_level is null or knowledge_level in ('iniciante', 'intermediario', 'avancado'));
  end if;
end $$;

-- o PostgREST só enxerga a coluna nova depois de recarregar o cache de schema
notify pgrst, 'reload schema';
