-- Rota 404: dados do catálogo (idempotente). Espelho exato de backend/app/data/seed.json,
-- que por sua vez é um snapshot das tabelas de catálogo do Supabase em produção.

insert into public.age_ranges (id, name, min_age, max_age, slug, description, created_at, updated_at)
values
  ('0c856487-b78e-405e-8b27-94a2d5dc8b09', '13 anos ou menos', 0, 13, '13-ou-menos', 'Universo de aprendizagem para exploradores de até 13 anos.', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('a09f8844-a733-444c-929c-c8a3a7ca161f', '14 anos ou mais', 14, null, '14-ou-mais', 'Universo de aprendizagem para exploradores a partir de 14 anos.', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00')
on conflict (id) do nothing;

insert into public.galaxies (id, age_range_id, name, slug, description, order_index, sprite_key, created_at, updated_at)
values
  ('87bdb573-d9fa-44fb-b5f0-ff6deb5096dd', '0c856487-b78e-405e-8b27-94a2d5dc8b09', 'Internet e Web', 'internet-e-web', 'Descubra como a Internet conecta o mundo.', 1, 'galaxy-internet-e-web', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('c21c7bb8-1bdb-4541-8518-e83cfd054744', 'a09f8844-a733-444c-929c-c8a3a7ca161f', 'API REST', 'api-rest', 'Explore como sistemas conversam entre si.', 1, 'galaxy-api-rest', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00')
on conflict (id) do nothing;

insert into public.planetary_systems (id, galaxy_id, name, slug, description, order_index, sprite_key, created_at, updated_at)
values
  ('8476d0aa-b1fd-44b3-8c18-0b2eba3db184', '87bdb573-d9fa-44fb-b5f0-ff6deb5096dd', 'Dispositivos e conexão', 'dispositivos-e-conexao', null, 1, 'star-1', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('f8fb02b1-2fde-41e3-9906-af4bfadde841', '87bdb573-d9fa-44fb-b5f0-ff6deb5096dd', 'Endereços e sites', 'enderecos-e-sites', null, 2, 'star-2', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('e529d3ff-c674-4bfb-8aae-d85876868b5b', '87bdb573-d9fa-44fb-b5f0-ff6deb5096dd', 'Navegador e páginas Web', 'navegador-e-paginas-web', null, 3, 'star-3', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('3c9f5340-e271-46a4-8870-0bffaebc5743', '87bdb573-d9fa-44fb-b5f0-ff6deb5096dd', 'Comunicação e segurança', 'comunicacao-e-seguranca', null, 4, 'star-4', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('3aed5f0e-b2e0-428a-8f57-4aaf50901071', 'c21c7bb8-1bdb-4541-8518-e83cfd054744', 'Conhecendo uma API', 'conhecendo-uma-api', null, 1, 'star-1', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('79a05b84-f077-42e0-8d0d-15e5b054db40', 'c21c7bb8-1bdb-4541-8518-e83cfd054744', 'Requisições HTTP', 'requisicoes-http', null, 2, 'star-2', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('6fc855ce-43ab-4861-9023-bdb09be46be1', 'c21c7bb8-1bdb-4541-8518-e83cfd054744', 'Entendendo os dados', 'entendendo-os-dados', null, 3, 'star-3', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00'),
  ('60bbf8fb-fa63-414f-a62e-984e37f76100', 'c21c7bb8-1bdb-4541-8518-e83cfd054744', 'API em situações reais', 'api-em-situacoes-reais', null, 4, 'star-4', '2026-10-08T23:26:10.643562+00:00', '2026-10-08T23:26:10.643562+00:00')
on conflict (id) do nothing;

insert into public.planets (id, planetary_system_id, name, slug, kind, order_index, sprite_key, created_at, updated_at)
values
  ('332fa3b7-b277-472a-a7c5-d1ddda87daee', '8476d0aa-b1fd-44b3-8c18-0b2eba3db184', '1.1 O que é uma rede?', 'o-que-e-uma-rede', 'lesson', 1, 'planet-api', '2026-10-09T12:31:10.963314+00:00', '2026-10-09T12:31:10.963314+00:00'),
  ('a99ac3e4-ac58-4d29-a608-d79cb47bec23', '8476d0aa-b1fd-44b3-8c18-0b2eba3db184', '1.2 Como meu dispositivo chega à internet?', 'como-meu-dispositivo-chega-a-internet', 'lesson', 2, 'planet-https', '2026-10-09T12:31:10.963314+00:00', '2026-10-09T12:31:10.963314+00:00'),
  ('d8a76f7c-f8a8-4485-a562-a1f56f66eaa9', '8476d0aa-b1fd-44b3-8c18-0b2eba3db184', '1.3 Conectando uma rede', 'conectando-uma-rede', 'lab', 3, 'planet-deploy', '2026-10-09T12:31:10.963314+00:00', '2026-10-09T12:31:10.963314+00:00'),
  ('be15cbee-f1e7-4e8a-8cdb-325e44765692', '8476d0aa-b1fd-44b3-8c18-0b2eba3db184', '1.4 Missão: recuperar a conexão', 'missao-recuperar-a-conexao', 'lab', 4, 'planet-erro404', '2026-10-09T12:31:10.963314+00:00', '2026-10-09T12:31:10.963314+00:00'),
  ('1eb5b228-70c6-4ebc-8b1c-6d0d7bfa01da', 'f8fb02b1-2fde-41e3-9906-af4bfadde841', '2.1 Todo dispositivo precisa de um endereço', 'todo-dispositivo-precisa-de-um-endereco', 'lesson', 1, 'planet-hashing', '2026-10-11T01:35:03.40028+00:00', '2026-10-11T01:35:03.40028+00:00'),
  ('39233cf4-36b9-4517-a9c8-b14bada25ac1', 'f8fb02b1-2fde-41e3-9906-af4bfadde841', '2.2 IP, domínio e site', 'ip-dominio-e-site', 'lesson', 2, 'planet-dns', '2026-10-11T01:35:03.40028+00:00', '2026-10-11T01:35:03.40028+00:00'),
  ('95af5ac6-f9eb-4bd2-84e9-3535f30a72f0', 'f8fb02b1-2fde-41e3-9906-af4bfadde841', '2.3 Encontrando o destino', 'encontrando-o-destino', 'lab', 3, 'planet-deploy', '2026-10-11T01:35:03.40028+00:00', '2026-10-11T01:35:03.40028+00:00'),
  ('fff18e03-8baf-470d-b136-7c03075c4548', 'f8fb02b1-2fde-41e3-9906-af4bfadde841', '2.4 Missão: encontrar o servidor', 'missao-encontrar-o-servidor', 'lab', 4, 'planet-erro404', '2026-10-11T01:35:03.40028+00:00', '2026-10-11T01:35:03.40028+00:00'),
  ('28178e76-38a1-445f-afb3-4e61ec61fbb9', 'e529d3ff-c674-4bfb-8aae-d85876868b5b', '3.1 O que acontece quando acesso um site?', 'o-que-acontece-quando-acesso-um-site', 'lesson', 1, 'planet-api', '2026-10-13T12:02:54.066822+00:00', '2026-10-13T12:02:54.066822+00:00'),
  ('69517683-7e23-432e-8b30-ce1198715810', 'e529d3ff-c674-4bfb-8aae-d85876868b5b', '3.2 HTML: os blocos de uma página', 'html-os-blocos-de-uma-pagina', 'lesson', 2, 'planet-hashing', '2026-10-13T12:02:54.066822+00:00', '2026-10-13T12:02:54.066822+00:00'),
  ('34d5ed89-e884-4f4e-921c-f6813d9eab21', 'e529d3ff-c674-4bfb-8aae-d85876868b5b', '3.3 Monte sua página', 'monte-sua-pagina', 'lab', 3, 'planet-deploy', '2026-10-13T12:02:54.066822+00:00', '2026-10-13T12:02:54.066822+00:00'),
  ('dc2289ef-4b9b-424d-b351-f4115bd95639', 'e529d3ff-c674-4bfb-8aae-d85876868b5b', '3.4 Conserte a página', 'conserte-a-pagina', 'lab', 4, 'planet-erro404', '2026-10-13T12:02:54.066822+00:00', '2026-10-13T12:02:54.066822+00:00'),
  ('0bc02c66-205e-4351-87cd-e4129dcd98e1', '3c9f5340-e271-46a4-8870-0bffaebc5743', '4.1 Como as informações viajam?', 'como-as-informacoes-viajam', 'lesson', 1, 'planet-dns', '2026-10-13T12:41:08.098548+00:00', '2026-10-13T12:41:08.098548+00:00'),
  ('c97af471-eb71-4239-8687-1a8288e2b8c5', '3c9f5340-e271-46a4-8870-0bffaebc5743', '4.2 HTTP e HTTPS', 'http-e-https', 'lesson', 2, 'planet-https', '2026-10-13T12:41:08.989903+00:00', '2026-10-13T12:41:08.989903+00:00'),
  ('002ca2f6-5188-4a95-aa6a-4466e12a5f6a', '3c9f5340-e271-46a4-8870-0bffaebc5743', '4.3 Detetive digital', 'detetive-digital', 'lab', 3, 'planet-hashing', '2026-10-13T12:41:09.565167+00:00', '2026-10-13T12:41:09.565167+00:00'),
  ('3a21810a-44f3-4ecd-ad77-a60bff685c83', '3c9f5340-e271-46a4-8870-0bffaebc5743', '4.4 Missão: navegação segura', 'missao-navegacao-segura', 'lab', 4, 'planet-erro404', '2026-10-13T12:41:10.113312+00:00', '2026-10-13T12:41:10.113312+00:00')
on conflict (id) do nothing;

insert into public.lessons (id, planet_id, title, slug, order_index, content, created_at, updated_at)
values
  ('95a3636d-25e3-4d45-b604-5bba2bce0897', '332fa3b7-b277-472a-a7c5-d1ddda87daee', 'O que é uma rede?', 'o-que-e-uma-rede', 1, '{"code": "1.1", "engine": "o-que-e-uma-rede", "central_idea": "Dispositivos conectados conseguem conversar e trocar informações."}'::jsonb, '2026-10-09T12:31:10.963314+00:00', '2026-10-09T12:31:10.963314+00:00'),
  ('4f05fd01-e9a7-4ffe-9869-8e1b97478f89', 'a99ac3e4-ac58-4d29-a608-d79cb47bec23', 'Como meu dispositivo chega à internet?', 'como-meu-dispositivo-chega-a-internet', 2, '{"code": "1.2", "engine": "como-meu-dispositivo-chega-a-internet", "central_idea": "Meu dispositivo não conversa diretamente com a internet de forma mágica: existe uma conexão no caminho."}'::jsonb, '2026-10-09T12:31:10.963314+00:00', '2026-10-09T12:31:10.963314+00:00'),
  ('ea94207c-1b82-4dc3-929f-fc2e789f0c17', '1eb5b228-70c6-4ebc-8b1c-6d0d7bfa01da', 'Todo dispositivo precisa de um endereço', 'todo-dispositivo-precisa-de-um-endereco', 1, '{"code": "2.1", "engine": "todo-dispositivo-precisa-de-um-endereco", "central_idea": "Um endereço ajuda a identificar para onde os dados devem ir."}'::jsonb, '2026-10-11T01:35:03.40028+00:00', '2026-10-11T01:35:03.40028+00:00'),
  ('5448c6a4-a313-4b4d-9042-87e52669e489', '39233cf4-36b9-4517-a9c8-b14bada25ac1', 'IP, domínio e site', 'ip-dominio-e-site', 2, '{"code": "2.2", "engine": "ip-dominio-e-site", "central_idea": "IP, domínio e página são coisas diferentes que participam do acesso a um site."}'::jsonb, '2026-10-13T11:40:52.421669+00:00', '2026-10-13T11:40:52.421669+00:00'),
  ('94ed3509-c3d9-4a09-b6d5-d03d56cbee5c', '28178e76-38a1-445f-afb3-4e61ec61fbb9', 'O que acontece quando acesso um site?', 'o-que-acontece-quando-acesso-um-site', 1, '{"code": "3.1", "engine": "o-que-acontece-quando-acesso-um-site", "central_idea": "O navegador pede; o servidor responde; o navegador mostra a página."}'::jsonb, '2026-10-13T12:02:54.066822+00:00', '2026-10-13T12:02:54.066822+00:00'),
  ('770916bf-a9de-4822-a9c9-a97f8b5fd5c6', '69517683-7e23-432e-8b30-ce1198715810', 'HTML: os blocos de uma página', 'html-os-blocos-de-uma-pagina', 2, '{"code": "3.2", "engine": "html-os-blocos-de-uma-pagina", "central_idea": "Uma página pode ser construída com blocos de conteúdo."}'::jsonb, '2026-10-13T12:30:26.268608+00:00', '2026-10-13T12:30:26.268608+00:00'),
  ('6aeba376-bd0d-486e-9408-2a1d327fb5a6', '0bc02c66-205e-4351-87cd-e4129dcd98e1', 'Como as informações viajam?', 'como-as-informacoes-viajam', 1, '{"code": "4.1", "engine": "como-as-informacoes-viajam", "central_idea": "O navegador envia uma requisição, o servidor processa o pedido e envia uma resposta."}'::jsonb, '2026-10-13T12:41:11.02847+00:00', '2026-10-13T12:41:11.02847+00:00'),
  ('cb980cd8-409e-4656-9295-04870e720eab', 'c97af471-eb71-4239-8687-1a8288e2b8c5', 'HTTP e HTTPS', 'http-e-https', 2, '{"code": "4.2", "engine": "http-e-https", "central_idea": "HTTP permite a comunicação. HTTPS protege essa comunicação com criptografia."}'::jsonb, '2026-10-13T12:47:18.993513+00:00', '2026-10-13T12:47:18.993513+00:00')
on conflict (id) do nothing;

insert into public.labs (id, planet_id, title, slug, order_index, max_score, config, created_at, updated_at)
values
  ('d0039508-5774-4eae-ac41-f38a9e9a7e2b', 'd8a76f7c-f8a8-4485-a562-a1f56f66eaa9', 'Conectando uma rede', 'conectando-uma-rede', 3, 100, '{"code": "1.3", "type": "montagem", "engine": "conectando-uma-rede"}'::jsonb, '2026-10-09T12:56:05.372271+00:00', '2026-10-09T12:56:05.372271+00:00'),
  ('b5f4bd4e-89d0-4985-aaab-0ac1684d34f1', 'be15cbee-f1e7-4e8a-8cdb-325e44765692', 'Missão: recuperar a conexão', 'missao-recuperar-a-conexao', 4, 100, '{"code": "1.4", "type": "diagnostico", "engine": "missao-recuperar-a-conexao"}'::jsonb, '2026-10-09T12:56:05.372271+00:00', '2026-10-09T12:56:05.372271+00:00'),
  ('7b5d0d70-70d9-4ab5-83db-dcd68f5cea36', '95af5ac6-f9eb-4bd2-84e9-3535f30a72f0', 'Encontrando o destino', 'encontrando-o-destino', 3, 100, '{"code": "2.3", "type": "associacao", "engine": "encontrando-o-destino"}'::jsonb, '2026-10-13T11:47:51.804322+00:00', '2026-10-13T11:47:51.804322+00:00'),
  ('d7c2d425-f705-4905-98c5-150318371ee5', 'fff18e03-8baf-470d-b136-7c03075c4548', 'Missão: encontrar o servidor', 'missao-encontrar-o-servidor', 4, 100, '{"code": "2.4", "type": "labirinto", "engine": "missao-encontrar-o-servidor"}'::jsonb, '2026-10-13T11:53:49.018951+00:00', '2026-10-13T11:53:49.018951+00:00'),
  ('c82aed05-0f90-4b0c-b00e-25b8a917e2c0', '34d5ed89-e884-4f4e-921c-f6813d9eab21', 'Monte sua página', 'monte-sua-pagina', 3, 100, '{"code": "3.3", "type": "construtor", "engine": "monte-sua-pagina"}'::jsonb, '2026-10-13T12:36:37.249627+00:00', '2026-10-13T12:36:37.249627+00:00'),
  ('574e3fc6-9785-41b4-86ac-d032926b23a6', 'dc2289ef-4b9b-424d-b351-f4115bd95639', 'Conserte a página', 'conserte-a-pagina', 4, 100, '{"code": "3.4", "type": "correcao", "engine": "conserte-a-pagina"}'::jsonb, '2026-10-13T12:36:38.834649+00:00', '2026-10-13T12:36:38.834649+00:00'),
  ('598300f5-5888-4d5b-a32d-79c36acc9a17', '002ca2f6-5188-4a95-aa6a-4466e12a5f6a', 'Detetive digital', 'detetive-digital', 3, 100, '{"code": "4.3", "type": "investigacao", "engine": "detetive-digital"}'::jsonb, '2026-10-13T12:58:27.469318+00:00', '2026-10-13T12:58:27.469318+00:00'),
  ('93cfc827-9e4d-4d3f-b922-40114bb77d80', '3a21810a-44f3-4ecd-ad77-a60bff685c83', 'Missão: navegação segura', 'missao-navegacao-segura', 4, 100, '{"code": "4.4", "type": "decisoes", "engine": "missao-navegacao-segura"}'::jsonb, '2026-10-13T13:02:02.570824+00:00', '2026-10-13T13:02:02.570824+00:00')
on conflict (id) do nothing;
