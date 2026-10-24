<!-- Referência detalhada gerada a partir da leitura do código em 17/10/2026. Se o código mudar, atualize este arquivo. -->
# Ficha técnica: BACKEND E DADOS (Rota 404)

Tudo abaixo foi conferido no código atual em 2026-10-17. Os caminhos são relativos à raiz do projeto. Também conferi na API que está no ar (`http://127.0.0.1:5000/api`): `GET /api/health` responde `{"data":{"status":"ok","data_source":"supabase","database":"ok"}}`, servidor `Werkzeug/3.1.9 Python/3.14.3`. raiz do projeto **não** é repositório git.

---

## 1. Estrutura e camadas

```
backend/
  run.py                      ponto de entrada: logging, load_settings(), create_app(), warmup e app.run()
  requirements.txt            Flask==3.1.3, supabase==2.32.0, python-dotenv==1.2.4
                              (transitivas instaladas: httpx 0.28.1, postgrest 2.32.0, Werkzeug 3.1.9, h2 4.4.1, httpcore 1.0.9)
  .env.example / .env         .env está no .gitignore
  app/__init__.py             create_app(settings) = composition root (DI manual) + register_cors()
  app/config/settings.py      Settings (dataclass frozen), Settings.from_env, load_settings(), is_loopback_host()
  app/config/supabase.py      create_supabase_client(url, key)
  app/errors.py               AppError e subclasses + register_error_handlers()
  app/routes/__init__.py      register_routes(): Blueprint "api", url_prefix="/api", tabela de rotas
  app/controllers/            camada fina (HTTP ↔ service); responses.py: ok(), optional_query_param(), json_body()
                              controllers/__init__.py: dataclass Controllers (health, age_ranges, galaxies, systems, learning, gamification, users)
  app/services/               regras; services/__init__.py: is_uuid(), require_by_ref(repo, ref, msg)
  app/repositories/           BaseRepository (+6 repositórios do catálogo) e data_source.py (DataSource, Local, Supabase, Cached)
  app/models/                 dataclasses frozen com Model.from_row(row) / to_dict()
  app/data/seed.json          snapshot do catálogo (fonte local e reserva)
  app/warmup.py               pré-aquecimento do cache
  tests/test_api.py, tests/test_resilience.py
  .venv/ ou venv/             ambiente virtual LOCAL (não vai no zip; recrie em cada máquina). Já houve um .venv Windows
                              (Python 3.14) e um venv Linux/WSL (Python 3.12) — use o nome que preferir, ambos estão no .gitignore
supabase/
  migrations/20261009000000_init_schema.sql
  seed.sql                    (não existe supabase/config.toml)
```

Arquivos da raiz que ficam fora desta área: `README.md`, `.gitignore`, `planetas (1).md`, `prompt_base (1).md`, `resumo (1).md`, as pastas `G1 - Internet e Web/`, `assets/` e `sprites geral/`, e `frontend/`.

**Fluxo:** `routes` → `controllers` (`XController`, recebe o service) → `services` (`XService`, recebe repositórios) → `repositories` (`BaseRepository` com `table`, `model`, `default_order`) → `DataSource` (`list` / `get` / `ping`).

- `create_app()` monta tudo à mão:
  - `data_source = create_data_source(settings)`;
  - os repositórios `AgeRangeRepository`, `GalaxyRepository`, `PlanetarySystemRepository`, `PlanetRepository`, `LessonRepository` e `LabRepository` usam o mesmo data source;
  - `GamificationService()` e `UserService()` não recebem dependências;
  - depois registra `register_error_handlers`, `register_cors` e `register_routes`.
- Também em `create_app()`: `app.json.ensure_ascii = False` (acentos legíveis) e `app.json.sort_keys = False` (os campos saem na ordem da dataclass).
- `BaseRepository` (`app/repositories/__init__.py`):
  - `get_by_id`, `get_by_slug`, `_list(filters)` (sempre com `list(self.default_order)`), `_get(column, value)`, `ping()`, `source_name`;
  - converte cada linha com `self.model.from_row(row)`.
- `Model.from_row` (`app/models/__init__.py`) usa `row.get(field.name)` para cada campo da dataclass. Colunas extras do banco são descartadas e campos ausentes viram `None`.
- Ordenação padrão por repositório:

  | Repositório | Ordem |
  |---|---|
  | AgeRange | `min_age` |
  | Galaxy | `order_index`, `name` |
  | PlanetarySystem | `order_index`, `name` |
  | Planet | `order_index`, `name` |
  | Lesson / Lab | `order_index`, `title` |

  O prefixo `-` indica ordem decrescente. `LocalDataSource` põe `None` por último.
- Filtro com `list`/`tuple` vira `IN` (por exemplo `list_by_systems`, `list_by_planet_ids`). Um `IN` vazio devolve `[]` sem consultar.

### Modelos (`app/models/`)

- `catalog.py`: `AgeRange`, `Galaxy`, `PlanetarySystem`, `Planet`, `PLANET_TYPES = ("lesson","lab")`.
- `learning.py`: `Lesson` (`content: dict|None`) e `Lab` (`max_score`, `config: dict|None`).
- **Mapeamento kind→type:** a tabela `planets` guarda o tipo na coluna `kind`. `Planet.from_row` copia `kind` para `type` quando `type` é `None`; um `type` explícito tem prioridade (testes `PlanetModelTest`). A API e o frontend usam `type`.
- `Planet` tem o campo `description`, mas a tabela `planets` **não tem essa coluna**. A API sempre devolve `"description": null` para planetas.
- `gamification.py` (`ProgressEntry`, `Score`, `Achievement`, `UserAchievement`, `RankingEntry`, `Ranking`) e `user.py` (`User`, `Avatar`) **não são usados** em lugar nenhum e estão dessincronizados da migration:
  - `ProgressEntry` tem `planet_id`/`started_at`, mas a tabela `user_progress` tem `entity_type`/`entity_id`/`progress_percent`;
  - `Score` não tem `galaxy_id`, que é obrigatório na tabela;
  - `Achievement.rarity` não existe na tabela;
  - `Avatar.order_index` não existe na tabela;
  - `User` não tem `avatar_key`, `token_hash` e `last_seen_at`.

---

## 2. Endpoints (todos com prefixo `/api`; tabela em `app/routes/__init__.py`)

**Envelope:**
- sucesso: `{"data": ...}`, gerado por `controllers/responses.ok(data, status=200)`;
- erro: `{"error": {"code": "...", "message": "..."}}`, gerado por `errors.error_response`.

**Referência `<ref>`:** slug **ou** UUID. `require_by_ref` testa `is_uuid`; um UUID vira minúsculas e é buscado por `id`, senão a busca é por `slug` (slug diferencia maiúsculas).

**Query params:** passam por `optional_query_param`. Um parâmetro vazio (`?galaxy=`) responde 400 `bad_request` com a mensagem "O parâmetro 'galaxy' não pode ser vazio.".

| Método | Rota | Params | `data` |
|---|---|---|---|
| GET | `/health` | – | `{status: "ok"\|"degraded", data_source: "supabase"\|"local", database: "ok"\|"error"}`. Sempre HTTP 200 e nunca usa cache (`ping()`) |
| GET | `/age-ranges` | – | `[AgeRange]` ordenado por `min_age` |
| GET | `/age-ranges/<ref>` | – | `AgeRange + galaxies:[Galaxy]` |
| GET | `/galaxies` | `?age_range=<ref>` | `[Galaxy]`. Sem filtro, ordena em Python por (`min_age` da faixa, `order_index`, `name`); com filtro, usa a ordem do repositório |
| GET | `/galaxies/<ref>` | – | `Galaxy + age_range:AgeRange\|null + systems:[System + planets:[Planet]]`. Os planetas de todos os sistemas vêm de **uma** consulta `IN`, que é pulada quando não há sistemas |
| GET | `/systems` | `?galaxy=<ref>` | `[System]` |
| GET | `/systems/<ref>` | – | `System + galaxy:Galaxy\|null + planets:[Planet]` |
| GET | `/lessons` | `?system=<ref>` | `[Lesson]` |
| GET | `/lessons/<ref>` | – | `Lesson + planet:Planet\|null + system:System\|null` |
| GET | `/labs` | `?system=<ref>` | `[Lab]` |
| GET | `/labs/<ref>` | – | `Lab + planet + system` |
| GET | `/progress` | – | **501** |
| PUT | `/progress/<planet_id>` | JSON | **501** |
| GET | `/scores` | – | **501** |
| POST | `/scores` | JSON | **501** (o sucesso futuro responderia 201) |
| GET | `/achievements` | – | **501** |
| GET | `/achievements/me` | – | **501** |
| GET | `/rankings/galaxies/<ref>` | – | **501** |
| GET | `/rankings/systems/<ref>` | – | **501** |
| GET | `/users/me` | – | **501** |
| POST | `/users` | JSON | **501** (o sucesso futuro responderia 201) |
| PATCH | `/users/me` | JSON | **501** |

Os 501 vêm de `GamificationService` e `UserService`, que só levantam `NotImplementedFeatureError` (mensagem "Recurso ainda não disponível nesta versão do Rota 404."). `json_body()` devolve `dict` ou `None` (`get_json(silent=True)`).

**Lessons e labs por ref** (`LearningService._get_detail` / `_find`): o ref pode ser id ou slug da aula ou laboratório, **ou** id ou slug do planeta.
- Com UUID, busca primeiro o planeta pelo id (é por ele que o frontend navega) e depois `get_by_planet_id`. São 3 consultas no total (`LearningQueriesTest`).
- Com slug, busca o slug do item e, se não achar, o slug do planeta.
- Quando o planeta é do tipo errado, responde 404 com mensagem específica:
  - `/labs/<planeta-aula>`: "Laboratório não encontrado: este planeta é uma aula."
  - `/lessons/<planeta-lab>`: "Aula não encontrada: este planeta é um laboratório."
- Demais 404: "Faixa etária não encontrada.", "Galáxia não encontrada.", "Sistema planetário não encontrado.", "Aula não encontrada.", "Laboratório não encontrado.".

**Códigos de erro** (`app/errors.py`):

| HTTP | `code` | Quando |
|---|---|---|
| 400 | `bad_request` | `BadRequestError` |
| 404 | `not_found` | `NotFoundError`, ou "Rota não encontrada." para rota inexistente |
| 405 | `method_not_allowed` | Inclui o cabeçalho `Allow`, ex. `GET, HEAD, OPTIONS` |
| 501 | `not_implemented` | `NotImplementedFeatureError` |
| 503 | `service_unavailable` | `ServiceUnavailableError`: "Banco de dados indisponível no momento. Tente novamente em instantes." |
| 500 | `internal_error` | Qualquer exceção inesperada; é logada com `logger.exception` |

**CORS** (`register_cors` em `app/__init__.py`):
- `before_request` responde 204 a qualquer `OPTIONS` de rota existente; `OPTIONS` em rota inexistente dá 404 JSON.
- `after_request` sempre adiciona `Vary: Origin`. Se o `Origin` estiver **exatamente** em `CORS_ORIGINS`, adiciona:
  - `Access-Control-Allow-Origin: <origin>`
  - `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- Não há cabeçalho de credentials. Os cabeçalhos também saem em respostas de erro.

---

## 3. Settings e variáveis de ambiente

- `load_settings()` faz `load_dotenv(BACKEND_DIR / ".env")` e depois `Settings.from_env(os.environ)`.
- python-dotenv não sobrescreve variáveis que já existem no SO, então **o ambiente do SO vence o `.env`**.
- `Settings` é uma dataclass frozen; `supabase_key` usa `field(repr=False)`.

| Variável | Default no código | `.env.example` | Parsing / efeito |
|---|---|---|---|
| `FLASK_DEBUG` | `False` | `1` | Verdadeiro se for um de `{"1","true","yes","on"}` (sem diferenciar maiúsculas). Com `HOST` fora do loopback, `run.py` ignora o debug e loga um warning |
| `HOST` | `127.0.0.1` | `127.0.0.1` | Valor vazio cai no default. `Settings.exposed_to_network = not is_loopback_host(host)`; contam como loopback `localhost`, `127.x`, `::1` e `[::1]`. `0.0.0.0` aceita a rede (tablets) |
| `PORT` | `5000` | `5000` | `int()`; um valor inválido derruba a inicialização com `ValueError` |
| `DATA_SOURCE` | `auto` | `auto` | `auto` / `supabase` / `local` (minúsculas). Outro valor gera `RuntimeError` |
| `SUPABASE_URL` | `""` | vazio | URL do projeto |
| `SUPABASE_KEY` | `""` | vazio | Chave **service_role**: ignora RLS e fica só no servidor |
| `CORS_ORIGINS` | `("http://localhost:3000","http://127.0.0.1:3000")`, só quando vazio | `http://localhost:3000` | Separadas por vírgula, com strip |
| `CATALOG_CACHE_SECONDS` | `3600` | `3600` | `float`, `max(0, …)`. `0` desliga o cache e também o warmup |
| `FALLBACK_TO_LOCAL` | `True` | `1` | Só é falso se for um de `{"0","false","no","off"}` |
| `WERKZEUG_RUN_MAIN` | – | – | Interna, definida pelo reloader do Werkzeug; `run.py` usa para aquecer só no processo que atende |

- `seed_path` (`DEFAULT_SEED_PATH = backend/app/data/seed.json`) **não** vem de variável de ambiente; só pode ser passado ao construtor de `Settings`.
- O `backend/.env` local não define `HOST` nem `FALLBACK_TO_LOCAL`, então valem os defaults. O servidor atual não libera o origin `http://127.0.0.1:3000`.
- Lado do frontend (só referência): `frontend/.env.example` tem `NEXT_PUBLIC_API_URL`. Sem ele, o navegador chama `http://<mesmo host da página>:5000/api` (`frontend/services/apiClient.ts`, `apiBaseUrl()`).

**`DATA_SOURCE`** (`_create_raw_data_source` em `data_source.py`):

| Modo | Credenciais | Resultado |
|---|---|---|
| `supabase` | sem `SUPABASE_URL`/`SUPABASE_KEY` | `RuntimeError` |
| `auto` ou `supabase` | as duas definidas | `SupabaseDataSource` |
| `auto` | ausentes | `LocalDataSource(seed.json)`, com o warning "SUPABASE_URL/SUPABASE_KEY não definidos…" |
| `local` | ignoradas | `LocalDataSource`, sem reserva |

---

## 4. DataSource (`backend/app/repositories/data_source.py`)

- **`DataSource`** é um `Protocol` só de leitura: `name`, `list(table, filters=None, order_by=None)`, `get(table, column, value)`, `ping()`. Não existe API de escrita.

### LocalDataSource
- Carrega o JSON no `__init__`.
- Filtra por igualdade ou `IN` (`_matches`).
- Ordena por várias chaves (sort estável, chaves percorridas em ordem reversa).
- Devolve cópias `dict(row)`; `ping()` sempre retorna `True`.

### SupabaseDataSource
- Monta `client.table(t).select("*")` e encadeia `.eq` / `.in_` / `.order(col, desc=…)`.
- `get` usa `.limit(1)`.
- `ping()` consulta `age_ranges.select("id").limit(1)`.
- `_execute` captura `(postgrest.exceptions.APIError, httpx.HTTPError)`, loga a tabela e o tipo do erro (sem a chave) e levanta `ServiceUnavailableError`. Um payload que não seja `list` também vira 503.

### CachedDataSource(source, ttl_seconds, tables=CATALOG_TABLES, clock=time.monotonic, fallback=None, refresher=None, retry_seconds=30.0)
- `CATALOG_TABLES = {age_ranges, galaxies, planetary_systems, planets, lessons, labs}`. Outras tabelas (futuras: `scores`, `users`…) **nunca** usam cache nem reserva: `read(self.source)` direto.
- **Chaves:** `("list", table, _freeze(filters), tuple(order_by))` e `("get", table, column, _freeze(value))`.
- **Misses também ficam em cache:** um `get` que devolve `None` é armazenado.
- **Cópias:** deepcopy ao armazenar e ao servir; quem chama não consegue mutar o cache.
- **TTL:** `CATALOG_CACHE_SECONDS`, padrão 3600 s.
- **Limite:** `MAX_ENTRIES = 512`. Ao encher, descarta os vencidos; se continuar cheio, limpa tudo. Os locks por chave são limpos ao chegar a 512.
- **Anti-manada (single-flight):** um `threading.Lock` por chave (`_key_lock`) com checagem dupla. Requisições simultâneas da mesma chave fria esperam a primeira; chaves diferentes carregam em paralelo.
- **Stale-while-revalidate:** com `refresher`, uma entrada vencida é servida na hora e `_refresh_later` agenda a revalidação. Há dedupe por chave em `_refreshing`.
  - O refresher é `refresh_in_background`: thread daemon `catalog-refresh`, limitada por `threading.BoundedSemaphore(REFRESH_WORKERS=4)` no nível do módulo.
  - Um miss frio sempre espera a fonte.
- **Stale-if-error:** se a fonte falhar e houver leitura anterior (mesmo vencida), ela é servida e regravada com TTL `min(retry_seconds, ttl)`, ou seja, 30 s.
- **Reserva (fallback):** sem leitura anterior, usa `read(self.fallback)` (seed.json), também com TTL de 30 s. Quando o banco volta, o dado real substitui o do seed.
- **Disjuntor:** só existe quando há `fallback`.
  - `_mark_down()` define `_down_until = now + 30 s`. Enquanto estiver aberto, `_read_source` levanta 503 sem tentar o banco e cai direto na reserva.
  - Loga um warning na primeira queda ("Fonte 'supabase' indisponível: catálogo servido do cache e da reserva 'local'; nova tentativa em 30 s.") e um info na volta ("Fonte '…' de volta…").
- **TTL ≤ 0:** `_read_uncached`, sem cache, mas ainda com reserva.
- `name` repete `source.name`; o health mostra "supabase" mesmo quando serve a reserva.
- `clear()` existe, mas **não é exposto** por nenhuma rota.

### create_data_source(settings)
- A fonte crua só é devolvida sem embrulho quando `catalog_cache_seconds <= 0` **e** não há reserva. Em todos os outros casos: `CachedDataSource(source, ttl, fallback=…, refresher=refresh_in_background)`.
- `_create_fallback` devolve `None` em três casos:
  - `FALLBACK_TO_LOCAL=0`;
  - a fonte já é local;
  - o seed.json não pode ser lido (`OSError`/`ValueError`), situação em que loga um erro e segue sem reserva.

---

## 5. Cliente Supabase (`backend/app/config/supabase.py`)

`create_supabase_client(url, key)` importa `httpx` e `supabase` só quando é chamado (lazy).

- `httpx.Client(http2=False, timeout=httpx.Timeout(5, connect=3), limits=httpx.Limits(max_connections=20, max_keepalive_connections=10, keepalive_expiry=60), follow_redirects=True)`.
- `ClientOptions(postgrest_client_timeout=5, auto_refresh_token=False, persist_session=False, httpx_client=http_client)`.
- **Por que HTTP/1.1:** o cliente padrão do postgrest usa HTTP/2 em uma conexão única, que falha com **WinError 10035** quando as threads do Flask consultam ao mesmo tempo. O pool HTTP/1.1 é seguro entre threads. `app.run` do Flask é threaded por padrão.
- **Timeouts:** conexão de 3 s (falha rápido com a rede caída, em vez de travar) e leitura de 5 s.
- **Keepalive de 60 s:** o padrão do httpx fecha a conexão após 5 s; 60 s mantém o TLS aberto entre consultas espaçadas.
- `_ = client.postgrest` cria o cliente postgrest na hora, porque a criação preguiçosa não tem trava entre threads.
- `run.py` sobe o logger `httpx` para WARNING. O formato de log é `%(levelname)s %(name)s: %(message)s`, no nível INFO.

---

## 6. Pré-aquecimento (`backend/app/warmup.py` + `backend/run.py`)

- `run.py` cria `app` no nível do módulo. Com `__main__`, calcula `serving = not debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true"`: com o reloader há 2 processos e só o filho aquece.
- `start_catalog_warmup(app)` só roda se `serving and settings.catalog_cache_seconds > 0`.
- `start_catalog_warmup` abre a thread daemon `catalog-warmup`. Ela loga "Cache do catálogo pré-aquecido: X de Y rotas em Z s." e, em caso de falha, faz `logger.exception`.
- `catalog_paths(app)` descobre as rotas pela própria API (`app.test_client()`), usando as **mesmas URLs e, portanto, as mesmas chaves de cache que o frontend**:
  - `/api/age-ranges`, `/api/systems`;
  - para cada galáxia: `/api/systems?galaxy=<slug>` e `/api/systems/<slug>` de cada sistema;
  - para cada planeta: `/api/lessons/<planet.id>` ou `/api/labs/<planet.id>`, conforme `type`, como faz `planetHref` em `frontend/lib/planetSlots.ts`.
  - `/api/galaxies` e `/api/galaxies/<slug>` ficam aquecidas porque são lidas durante a descoberta.
- Com o seed atual são **28 caminhos**. `warm_catalog` usa `ThreadPoolExecutor(max_workers=4)` e devolve `(rotas com 200, total)`.
- Não aquece `/api/age-ranges/<ref>`, `/api/lessons`, `/api/labs` nem `/api/galaxies?age_range=`.
- O warmup **só acontece via `python run.py`**. `create_app()` sozinho, testes ou um servidor WSGI externo não aquecem.

---

## 7. Banco (`supabase/migrations/20261009000000_init_schema.sql`)

O script é idempotente: `create … if not exists` e `drop … if exists` antes de cada policy e trigger. O cabeçalho diz que espelha a produção por introspecção da REST API; unique, check e on delete seguem as regras do domínio.

Tabelas do **catálogo**:

| Tabela | Colunas, na ordem |
|---|---|
| `age_ranges` | id uuid pk default gen_random_uuid(), name, min_age int not null check ≥0, max_age int null (check `max_age is null or max_age >= min_age`), slug unique, description, created_at, updated_at |
| `galaxies` | id, age_range_id → age_ranges on delete cascade, name, slug unique, description, order_index int default 0, sprite_key, created_at, updated_at |
| `planetary_systems` | id, galaxy_id → galaxies cascade, name, slug unique, description, order_index, sprite_key, created_at, updated_at |
| `planets` | id, planetary_system_id → planetary_systems cascade, name, slug unique, **kind** text not null check (kind in ('lesson','lab')), order_index, sprite_key, created_at, updated_at. **Sem `description`** |
| `lessons` | id, planet_id **unique** → planets cascade, title, slug unique, order_index, content jsonb (`{"code","engine","central_idea"}`), created_at, updated_at |
| `labs` | id, planet_id unique → planets cascade, title, slug unique, order_index, max_score int default 0 check ≥0, config jsonb (`{"code","type","engine"}`), created_at, updated_at |

Todos os timestamps são `timestamptz not null default now()`.

Tabelas **futuras** (sem seed e sem uso no backend):
- `avatars` (name, slug, sprite_key not null);
- `users` (display_name, age_range_id e avatar_id com on delete set null, avatar_key, token_hash, last_seen_at);
- `user_progress` (user_id, entity_type, entity_id, status com check locked/available/in_progress/completed, progress_percent 0–100);
- `scores` (user_id, galaxy_id **not null**, planetary_system_id, lab_id, points ≥0);
- `achievements` (name, slug, description, sprite_key, criteria jsonb, order_index);
- `user_achievements` (user_id, achievement_id, unlocked_at, unique(user_id, achievement_id)).

Regras gerais:
- Toda FK uuid tem índice ou é unique (14 FKs verificadas em teste).
- A função `public.set_updated_at()` (plpgsql, `search_path=''`) e o trigger `set_updated_at` estão nas 12 tabelas.
- RLS está ativo nas 12 tabelas. A policy `catalog_public_read` (select para anon e authenticated) existe **só** no catálogo, em `achievements` e em `avatars`; as tabelas de usuário não têm policy pública.
- Privilégios: `revoke all` de anon e authenticated, `grant select` no catálogo, `achievements` e `avatars`, e `grant select, insert, update, delete` de tudo para `service_role`.

---

## 8. Seed: `supabase/seed.sql` × `backend/app/data/seed.json`

- O seed.sql se declara "espelho exato" do seed.json, que é um snapshot da produção.
- Os inserts seguem a ordem das FKs (age_ranges → galaxies → planetary_systems → planets → lessons → labs) e terminam em `on conflict (id) do nothing`. Os campos jsonb usam `'…'::jsonb`, 16 ocorrências.
- **Conteúdo:**
  - 2 faixas: `13-ou-menos` (0–13) e `14-ou-mais` (14–null).
  - 2 galáxias: `internet-e-web` (faixa 13-, sprite `galaxy-internet-e-web`) e `api-rest` (faixa 14+).
  - 8 sistemas: 4 por galáxia, sprites `star-1..4`, `description` null.
  - 16 planetas, 8 aulas e 8 labs, **todos na galáxia `internet-e-web`**: 4 sistemas com 4 planetas cada (x.1 e x.2 são lesson, x.3 e x.4 são lab).
  - Os 4 sistemas de `api-rest` (`conhecendo-uma-api`, `requisicoes-http`, `entendendo-os-dados`, `api-em-situacoes-reais`) **não têm planetas**.
  - Todos os labs têm `max_score` 100. Tipos de `config.type`: montagem, diagnostico, associacao, labirinto, construtor, correcao, investigacao, decisoes.
- **Invariantes conferidas em teste:**
  - o slug da aula ou lab é igual ao slug do planeta;
  - `content.engine` / `config.engine` é igual ao slug;
  - `code` segue `x.y`;
  - a lista dos 16 motores do G1 está em `G1_ENGINES` (`tests/test_api.py`).
- **Teste de consistência** (`SeedConsistencyTest` em `test_api.py`): `parse_seed_sql()` lê o SQL por regex e compara com o JSON.
  - linhas idênticas, **inclusive na ordem das tabelas e das colunas**;
  - UUIDs e slugs iguais a `SPEC_IDS`;
  - conjunto de UUIDs igual;
  - FKs consistentes e na ordem certa.
- `MigrationStructureTest.test_catalog_columns_match_the_snapshot` exige que **a ordem das colunas no `create table` seja igual à ordem das chaves do seed.json**. Também verifica `kind` (não `type`) em `planets`, triggers e RLS em todas as tabelas, policies só no catálogo, índices de FK e idempotência.

---

## 9. Testes

- 110 testes de `unittest`: 81 em `tests/test_api.py` e 29 em `tests/test_resilience.py`. Rodam em cerca de 1 s.
- Não há pytest nas dependências. Os testes não usam rede: o Supabase é simulado com `mock.patch("app.config.supabase.create_supabase_client", …)` e os fakes `FakeSupabaseClient`/`FakeQuery`, `FailingSupabaseClient`, `Remote`, `RecordingSource`, `Clock`/`FakeClock` e `ManualRefresher`.
- Cada arquivo faz `sys.path.insert(0, BACKEND_DIR)`.
- Os 110 passaram em Python 3.14.3 (Windows) e em Python 3.12.3 (Linux/WSL) em 17/10/2026.
- Classes de `test_api.py`:
  - API do catálogo: `CatalogApiTest`, `LearningApiTest`, `GalaxyOrderTest`, `GalaxyPlanetsQueryTest`, `PlanetModelTest`;
  - erros e CORS: `ErrorApiTest` (404/405/501), `CorsTest`;
  - fontes de dados: `SupabaseDataSourceTest`, `LocalDataSourceTest`, `CachedDataSourceTest`, `CreateDataSourceTest`;
  - dados: `SeedConsistencyTest`, `MigrationStructureTest`.
- Classes de `test_resilience.py`: `SingleFlightTest`, `StaleWhileRevalidateTest`, `StaleIfErrorTest`, `FallbackTest`, `SettingsTest` (exige `HOST=127.0.0.1`, `FALLBACK_TO_LOCAL=1` e `CATALOG_CACHE_SECONDS=3600` no `.env.example`), `CreateDataSourceFallbackTest`, `ApiWithSupabaseDownTest` (garante que "chave-fake" não aparece nos logs), `LearningQueriesTest`, `WarmupTest`.

---

## 10. Compatibilidade com Python 3.12 (`from __future__ import annotations`)

- O README pede Python 3.12+. O código usa `typing.Self` (3.11+), `X | None` (3.10+) e `zip(strict=True)` (3.10+).
- `backend/app/repositories/data_source.py`, linha 1, tem `from __future__ import annotations`. É **obrigatório**:
  - `SupabaseDataSource` define o método `list` e, depois dele, `_execute(...) -> list[Row]` (linha 121).
  - Em 3.12 as anotações são avaliadas na definição, no escopo da classe, onde `list` já é a função. Resultado: `TypeError: 'function' object is not subscriptable` ao importar.
  - Em 3.14 (PEP 649, anotações preguiçosas) o import funciona, então **testes rodando só em 3.14 não pegam essa regressão**.
  - Conferi executando o módulo sem a linha: falha em 3.12.3 e passa em 3.14.3.
- `app/warmup.py` também tem o `__future__`, mas lá ele é inofensivo e não é necessário.
- Regra prática: em qualquer classe com método chamado `list` (ou outro nome de builtin), use o `__future__` ou não anote com `list[...]` depois desse método.

---

## 11. Comandos (Windows, PowerShell, a partir da raiz do projeto; use aspas por causa de espaços e acentos)

```powershell
cd "backend"
python -m venv .venv                      # ou: py -3.12 -m venv .venv  (qualquer Python 3.12+)
.\.venv\Scripts\Activate.ps1              # cmd: .venv\Scripts\activate  (se o PS bloquear: Set-ExecutionPolicy -Scope Process Bypass)
pip install -r requirements.txt
Copy-Item .env.example .env               # preencher SUPABASE_URL/SUPABASE_KEY, ou DATA_SOURCE=local
python run.py                             # http://127.0.0.1:5000/api/health
python -m unittest discover -s tests      # 110 testes
python -m unittest discover -s tests -p "test_resilience.py"     # um arquivo
python -m unittest tests.test_resilience.SettingsTest            # uma classe
.\.venv\Scripts\python.exe -B -m unittest discover -s tests      # sem ativar a venv e sem gerar __pycache__
```

- Supabase: no SQL Editor, rode a migration e depois `supabase/seed.sql`. Com a CLI já vinculada, `supabase db push` e depois o seed.
- Feira (tablets): no `backend/.env`, `FLASK_DEBUG=0`, `HOST=0.0.0.0` e `CORS_ORIGINS=http://localhost:3000,http://<IP>:3000`. Libere as portas 3000 e 5000 no firewall (rede privada).
- Para publicar conteúdo novo do banco antes de o TTL vencer, reinicie a API.

## 12. Como estender (padrão do código)

1. Nova rota: adicione uma tupla `(rule, endpoint, view, method)` em `app/routes/__init__.py`.
2. Crie o método no controller, retornando `ok(...)` e usando `optional_query_param` / `json_body`.
3. Crie o service, que levanta `NotFoundError` / `BadRequestError`.
4. Crie o repositório herdando `BaseRepository` (`table`, `model`, `default_order`) e o model como dataclass frozen herdando `Model`.
5. Ligue tudo em `create_app()` (`app/__init__.py`) e, se for um controller novo, no dataclass `Controllers`.
6. Uma nova tabela de catálogo precisa entrar em `CATALOG_TABLES` para ganhar cache e reserva. Atualize migration, seed.sql e seed.json com **a mesma ordem de colunas**; os testes de seed e migration vão exigir isso.
7. Gamificação e usuários (hoje 501):
   - o `DataSource` é só leitura, então será preciso acrescentar escrita;
   - essas tabelas ficam fora do cache e da reserva, então o Supabase fora do ar devolve 503;
   - o backend usa service_role, que ignora RLS;
   - o CORS já libera POST, PUT, PATCH, DELETE e o cabeçalho `Authorization`;
   - alinhe os models de `app/models/gamification.py` e `app/models/user.py` com a migration antes de usá-los.


## Armadilhas
- Não remova o 'from __future__ import annotations' da linha 1 de backend/app/repositories/data_source.py. Sem ele o import quebra em Python 3.12 com "TypeError: 'function' object is not subscriptable", porque SupabaseDataSource._execute (linha 121) anota '-> list[Row]' depois de definir o método 'list'. Em 3.14 (PEP 649) funciona, então testes só em 3.14 não pegam essa regressão. Valide também com Python 3.12.
- Ambientes virtuais (.venv/ ou venv/) e __pycache__ são locais de cada máquina e não devem ir no zip. Uma venv criada no WSL/Linux (bin/) não funciona no Windows (Scripts/) e vice-versa: recrie com `python -m venv .venv` + `pip install -r requirements.txt`.
- Mantenha o cliente Supabase em HTTP/1.1 (http2=False) e a criação antecipada 'client.postgrest' em backend/app/config/supabase.py. O HTTP/2 padrão do postgrest usa uma conexão única e falha com WinError 10035 quando as threads do Flask consultam ao mesmo tempo, e a criação preguiçosa não é thread-safe.
- No banco o tipo do planeta fica na coluna 'kind'; a API e o frontend usam 'type'. Quem converte é Planet.from_row (backend/app/models/catalog.py). A tabela planets não tem 'description', então a API sempre devolve description null para planetas.
- GET /api/health sempre responde HTTP 200. Para saber se o banco caiu, leia data.status ('degraded') e data.database ('error'). O campo data_source mostra 'supabase' mesmo quando o catálogo está saindo da reserva seed.json.
- O catálogo fica em cache por 3600 s (CATALOG_CACHE_SECONDS) e, depois de vencido, a primeira requisição ainda recebe o dado antigo (stale-while-revalidate). Não existe rota para invalidar o cache (CachedDataSource.clear() não é exposto). Para publicar conteúdo novo do Supabase na hora, reinicie a API.
- FALLBACK_TO_LOCAL=0 também desliga o disjuntor. Com o Supabase fora do ar, cada miss frio espera até 3 s (conexão) ou 5 s (leitura) antes do 503. Entradas já em cache continuam sendo servidas (stale-if-error).
- Tabelas fora de CATALOG_TABLES (users, scores, user_progress etc.) nunca usam cache nem reserva. Quando forem implementadas, o Supabase fora do ar vai devolver 503 nelas. O Protocol DataSource é só leitura (list/get/ping) e não tem métodos de escrita.
- O pré-aquecimento só acontece via 'python run.py' e só se CATALOG_CACHE_SECONDS > 0. Com FLASK_DEBUG=1 o reloader cria dois processos e só o filho (WERKZEUG_RUN_MAIN=true) aquece. create_app(), os testes e servidores WSGI não aquecem. catalog_paths precisa pedir as mesmas URLs do frontend, porque a chave de cache inclui filtros e ordem.
- Com HOST fora do loopback (ex.: 0.0.0.0), run.py ignora FLASK_DEBUG=1 por segurança: o debugger do Werkzeug executa código.
- O CORS compara o Origin de forma exata. O default ('http://localhost:3000' e 'http://127.0.0.1:3000') só vale quando CORS_ORIGINS está vazio. O .env.example (e o .env atual) liberam só http://localhost:3000, então abrir o frontend em http://127.0.0.1:3000 ou pelo IP da rede falha por CORS até a origem ser adicionada.
- load_dotenv não sobrescreve variáveis que já existem no SO: uma variável definida no ambiente do Windows vence o backend/.env. PORT ou CATALOG_CACHE_SECONDS inválidos derrubam a inicialização com ValueError; DATA_SOURCE inválido, ou 'supabase' sem URL/KEY, gera RuntimeError.
- seed.sql usa 'on conflict (id) do nothing': rodar de novo não atualiza linhas que já existem. Para corrigir conteúdo, faça update ou delete no banco.
- seed.json, seed.sql e a migration precisam estar sincronizados, inclusive na ordem das colunas (test_rows_are_identical e test_catalog_columns_match_the_snapshot). Invariantes testadas: o slug da aula ou lab é igual ao slug do planeta, content.engine/config.engine é igual ao slug, há 16 planetas G1 e todo max_score é 100.
- A galáxia 'api-rest' (faixa 14+) tem 4 sistemas e nenhum planeta, aula ou lab no seed. Todo o conteúdo atual está em 'internet-e-web'.
- Os models de backend/app/models/gamification.py e user.py não são usados e não batem com a migration. Exemplos: ProgressEntry tem planet_id, mas user_progress tem entity_type/entity_id/progress_percent; Score não tem galaxy_id, que é obrigatório; Achievement.rarity e Avatar.order_index não existem nas tabelas. Alinhe antes de implementar os endpoints que hoje respondem 501.
- Um query param vazio (ex.: '?galaxy=') responde 400 em vez de ser ignorado. Refs em UUID viram minúsculas; slugs diferenciam maiúsculas e minúsculas. Em /api/lessons/<ref> e /api/labs/<ref>, o ref pode ser o id ou slug do planeta, e um planeta do tipo errado dá 404 com mensagem específica.
- SUPABASE_KEY é a chave service_role, que ignora RLS: use só no backend, nunca no frontend. Settings.supabase_key tem repr=False e um teste garante que a chave não aparece nos logs. Nunca copie valores do backend/.env para documentação.
- Rodar os testes grava __pycache__. Em tarefas somente leitura, use 'python -B' ou PYTHONDONTWRITEBYTECODE=1. No PowerShell, ative a venv com .\.venv\Scripts\Activate.ps1; o README mostra a forma do cmd (.venv\Scripts\activate).
