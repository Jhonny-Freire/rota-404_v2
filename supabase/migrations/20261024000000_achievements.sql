-- Rota 404 — catálogo de conquistas (19). Rode no SQL Editor do Supabase (idempotente: pode rodar de novo; atualiza
-- nome, descrição e arte). As tabelas achievements e user_achievements já existem (init_schema). Espelho de
-- supabase/seed.sql e backend/app/data/seed.json; nomes e regras de desbloqueio em frontend/config/achievements.ts.

insert into public.achievements (id, name, slug, description, sprite_key, criteria, order_index, created_at, updated_at)
values
  ('7669bd27-1f20-4802-8cd4-464bed4ef0b8', 'Traje novo', 'c-01', 'Trocar de personagem no perfil.', 'c-01', '{"code": "C-01", "rarity": "comum", "secret": false}'::jsonb, 1, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('f2cf728f-56be-4094-81f3-5067d5728a76', 'Primeiro pouso', 'c-02', 'Completar um planeta.', 'c-02', '{"code": "C-02", "rarity": "comum", "secret": false}'::jsonb, 2, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('adebad55-aebb-483f-afdb-1f8d4c0ea1d4', 'Sistema explorado', 'c-03', 'Completar um sistema planetário.', 'c-03', '{"code": "C-03", "rarity": "comum", "secret": false}'::jsonb, 3, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('569301b0-9bef-492c-a1c6-e800f49bbc08', 'Cabeça fria', 'c-04', 'Completar um laboratório sem cometer nenhum erro.', 'c-04', '{"code": "C-04", "rarity": "comum", "secret": false}'::jsonb, 4, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('ba34ed7d-7e26-4493-b180-c05a463a30cf', 'Estrela em ascensão', 'c-05', 'Fazer mais de 7.000 pontos em um laboratório.', 'c-05', '{"code": "C-05", "rarity": "comum", "secret": false}'::jsonb, 5, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('65380ca6-547f-476e-b102-e998736fad8e', 'Segunda volta', 'c-06', 'Refazer um laboratório.', 'c-06', '{"code": "C-06", "rarity": "comum", "secret": false}'::jsonb, 6, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('032378bf-9248-4a3c-a4db-3c9394b5ce22', 'Brilho de supernova', 'r-02', 'Fazer mais de 9.000 pontos em um laboratório.', 'r-02', '{"code": "R-02", "rarity": "rara", "secret": false}'::jsonb, 7, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('12032274-d0dc-469b-82ba-8b07f6d82789', 'Mente brilhante', 'r-03', 'Completar um sistema planetário sem cometer nenhum erro nos laboratórios.', 'r-03', '{"code": "R-03", "rarity": "rara", "secret": false}'::jsonb, 8, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('591f45c6-a04e-45e6-b9d8-6bdd48e2cd1b', 'Pódio do sistema', 'r-04', 'Ficar entre os 3 primeiros no ranking de um sistema planetário.', 'r-04', '{"code": "R-04", "rarity": "rara", "secret": false}'::jsonb, 9, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('b8c7f27f-367f-4f49-9139-4ea1228fbd76', 'Entre os dez', 'r-05', 'Ficar entre os 10 primeiros no ranking da galáxia.', 'r-05', '{"code": "R-05", "rarity": "rara", "secret": false}'::jsonb, 10, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('ce0def9d-415b-4f54-9742-34497bb4157c', 'Nota máxima', 'l-01', 'Fazer a pontuação máxima (10.000) em um laboratório.', 'l-01', '{"code": "L-01", "rarity": "lenda", "secret": false}'::jsonb, 11, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('49926258-1557-491d-a468-cbb6f6a61e44', 'Sistema perfeito', 'l-02', 'Fazer a pontuação máxima em todos os laboratórios de um sistema planetário.', 'l-02', '{"code": "L-02", "rarity": "lenda", "secret": false}'::jsonb, 12, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('545354f7-3f5f-4ce4-82e8-cdf5942c8fc9', 'Viajante da galáxia', 'l-03', 'Completar uma galáxia.', 'l-03', '{"code": "L-03", "rarity": "lenda", "secret": false}'::jsonb, 13, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('53f00a38-4476-4b2b-92f2-2ce49a02f893', 'Lenda do ranking', 'l-04', 'Ficar entre os 3 primeiros no ranking da galáxia.', 'l-04', '{"code": "L-04", "rarity": "lenda", "secret": false}'::jsonb, 14, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('dc51160c-fb6f-4326-bb44-42fa9ad973ac', 'Gênio da galáxia', 'b-01', 'Completar uma galáxia sem cometer nenhum erro nos laboratórios.', 'b-01', '{"code": "B-01", "rarity": "brutal", "secret": false}'::jsonb, 15, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('d0dad668-482b-4d53-8282-3b0e39995f45', 'Incansável', 'b-02', 'Refazer todos os laboratórios de uma galáxia.', 'b-02', '{"code": "B-02", "rarity": "brutal", "secret": false}'::jsonb, 16, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('09d0b85b-8706-43ea-9dc5-2205cffc96e2', 'Piaba ao quadrado', 's-01', 'Usar o apelido Piaba com o personagem Piaba.', 's-01', '{"code": "S-01", "rarity": "secreta", "secret": true}'::jsonb, 17, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('744d72ef-09b1-42b0-9588-402db933bcc8', 'Perdido no espaço', 's-02', 'Encontrar um endereço que não existe.', 's-02', '{"code": "S-02", "rarity": "secreta", "secret": true}'::jsonb, 18, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00'),
  ('40ddbaf6-58a8-44c9-b2e9-f43114d5dc4b', 'Refrescante', 's-03', 'Pegar um suco de abacaxi perdido no espaço.', 's-03', '{"code": "S-03", "rarity": "secreta", "secret": true}'::jsonb, 19, '2026-10-24T12:00:00+00:00', '2026-10-24T12:00:00+00:00')
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  sprite_key = excluded.sprite_key,
  criteria = excluded.criteria,
  order_index = excluded.order_index;
