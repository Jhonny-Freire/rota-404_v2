<!-- Referência detalhada gerada a partir da leitura do código em 17/10/2026. Se o código mudar, atualize este arquivo. -->
# Ficha técnica: FRONTEND (núcleo, sem `components/learning`)

Todos os caminhos são relativos à raiz do projeto. O frontend fica em `frontend/`, e o alias `@/*` aponta para `frontend/*` (veja `frontend/tsconfig.json`, campo `paths`).

## 1. Stack e configuração
- **`frontend/package.json`** (nome `rota-404-frontend`):
  - versões fixas: `next` 16.4.0, `react` e `react-dom` 19.3.0, `typescript` 5.9.3, `@types/node` ^24.
  - scripts: `dev` (next dev), `build`, `start`, `typecheck` (tsc --noEmit).
  - Não há ESLint, Prettier nem framework de testes no frontend. A única verificação é o `typecheck`.
- **`frontend/next.config.ts`**: `reactStrictMode: true` (no dev os efeitos rodam 2x) e `agentRules: false`. Essa opção do Next 16 impede que o `next dev` gere sozinho um `AGENTS.md` na raiz. Não há `allowedDevOrigins`, `rewrites` nem `images`.
- **`frontend/tsconfig.json`**: `strict`, `moduleResolution: bundler`, `jsx: react-jsx`, `incremental`, plugin `next`.
- O Next exige Node >= 20.9 (`engines` do pacote next). O desenvolvimento foi feito com Node 24.
- **`frontend/.env.example`**: tem só `NEXT_PUBLIC_API_URL`, e comentada. Não existe `frontend/.env.local`. `.gitignore` (na raiz) ignora `.env`, `.env.local`, `.next/`, `node_modules/`, `tsconfig.tsbuildinfo` e `next-env.d.ts`.
- `npx tsc --noEmit` passou sem erros no código atual (exit 0).

## 2. Comandos
```bash
cd frontend
npm install
npm run dev          # http://localhost:9000 (só no próprio PC; next dev bloqueia outros dispositivos sem allowedDevOrigins)
npm run build        # PRECISA DE INTERNET: next/font/google baixa as fontes no build
npm run start        # produção (use build+start para tablets/celulares na rede)
npm run typecheck
```
- No Windows o caminho tem espaços e acentos, então use sempre caminhos absolutos entre aspas.
- A API Flask precisa estar no ar em `:9001`. Veja `README.md` e `backend/`.

## 3. Modelo de renderização
- As 11 páginas `app/**/page.tsx` e `app/not-found.tsx` começam com `"use client"`. Todos os dados vêm do navegador via `fetch`. Não há Server Components com dados, server actions nem route handlers.
- `app/layout.tsx` é Server Component. Ele exporta `metadata` (template de título `"%s | Rota 404"`) e `viewport` (`themeColor #070716`, `colorScheme: dark`), renderiza `<SpaceBackground/>` fora dos providers e envolve o resto com `<Providers>`. Usa `<html lang="pt-BR">`.
- Páginas client continuam pré-renderizadas no servidor. Por isso:
  - `localStorage` só é lido em `useEffect`. Contextos e componentes expõem `hydrated` e esperam por ele antes de mostrar estado salvo (ex.: o HUD do sistema mostra `--` até hidratar).
  - Dados da API na primeira renderização aparecem como "Carregando".
- Favicon: `app/icon.png` (convenção do App Router).
- Imagens usam `<img>` simples através de `components/ui/Sprite.tsx`. `next/image` não é usado.

## 4. Rotas (`config/routes.ts` → `ROUTES`, `ROUTE_PREFIXES`)
| Rota | Arquivo | O que faz |
|---|---|---|
| `/` | `app/page.tsx` | Landing. `AppShell variant="immersive"` (sem MainNav). Logo, botões "Iniciar viagem" (sem sessão → `/entrar`) / "Continuar viagem" (com sessão → próximo planeta a fazer, `useJourney`) e "Ver mapa" (→ galáxia da criança), atalhos (Perfil + itens de `NAV_ITEMS` menos Mapa), trilha Galáxias/Sistemas/Planetas. |
| `/faixas-etarias` | `app/faixas-etarias/page.tsx` | Chama `getAgeRanges()` e `getGalaxies()` (cacheKey `age-ranges+galaxies`). Cada faixa vira um "portal" com suas galáxias. Escolher chama `setAgeRange(slug)` e depois `router.push('/galaxias')`. |
| `/galaxias` | `app/galaxias/page.tsx` | `SpaceMap` com as galáxias, sem arestas (`edges=[]`). O estado vem de `galaxyStateForExplorer`. O progresso por galáxia vem de `getGalaxyDetails(slugs)` + `galaxyPlanetIds`. Clicar numa galáxia bloqueada liga um aviso do Bonzi. Tem legenda de estados e botão "Trocar faixa". |
| `/galaxias/[galaxySlug]` | `app/galaxias/[galaxySlug]/page.tsx` | `getGalaxy(slug)`. Os sistemas são ordenados por `order_index` e posicionados em zigue-zague (`pathPosition`). O estado do sistema é `aggregateState` dos planetas. O foguete fica no primeiro sistema que ainda não chegou a 100%. |
| `/sistemas/[systemSlug]` | `app/sistemas/[systemSlug]/page.tsx` | `loadSystem` busca `getSystem` e `getSystems()` em paralelo (os vizinhos servem para os botões anterior/próximo). Planetas em órbita (`orbitPosition`, 120px) vêm de `buildPlanetSlots`. `SystemHud` mostra os pontos (só labs), a coleção de planetas com selo e o contador concluídos/total. "Próximo sistema" ganha `attention` quando o sistema está completo. Clicar num planeta bloqueado faz o Bonzi avisar (usa `messageKey` para repetir a fala). |
| `/aulas/[id]?sistema=<slug>` | `app/aulas/[id]/page.tsx` | `<Suspense>` + `PlanetScreen kind="lesson"`. Precisa de Suspense porque usa `useSearchParams`. |
| `/laboratorios/[id]?sistema=<slug>` | `app/laboratorios/[id]/page.tsx` | Igual à anterior, com `kind="lab"`. |
| `/perfil` | `app/perfil/page.tsx` | Nome (máx. 24), `AvatarPicker`, faixa etária, planetas concluídos, `ScoreCounter` total, progresso por galáxia e prévia de 4 conquistas (as mais recentes; depois as próximas a buscar; secretas por último), título "Conquistas N/19". Trocar de personagem desbloqueia C-01. |
| `/conquistas` | `app/conquistas/page.tsx` | `useAchievements()` + `config/achievements.ts` (não chama a API). Contador, uma linha com o total por raridade, as 19 medalhas compactas numa grade (7 por fileira em tela larga, na ordem das raridades) e o painel de detalhe da escolhida (arte 128px = 4x, como ganhar, data). Secretas bloqueadas: "???" e silhueta. |
| `/ranking` | `app/ranking/page.tsx` | Abas acessíveis "Por galáxia" e "Por sistema" (setas, Home e End). `RankingResult` chama `getGalaxyRanking` ou `getSystemRanking`. Com 501, `RankingBoard` fica vazio e mostra `StatusView coming-soon`. |
| `/configuracoes` | `app/configuracoes/page.tsx` | Nome, faixa, toggles (narração, efeitos sonoros, volume 0–100 em passos de 5, mostrar Bonzi, reduzir animações, `unlockAll` "modo apresentação"). "Apagar dados locais" pede um segundo clique e chama `reset()` + `resetSettings()` + `resetProgress()`. |
| 404 | `app/not-found.tsx` | Porta 404 e botões Início/Mapa. |

- A rota de aula/lab recebe o **id do planeta**: `lib/planetSlots.ts → planetHref(type, planet.id, system.slug)` gera `ROUTES.lesson(id, systemSlug)` ou `ROUTES.lab(...)`, com `?sistema=` na query. Segundo `learningService`, a API aceita id ou slug da aula/lab ou do planeta.
- Os itens do menu estão em `config/navigation.ts → NAV_ITEMS`: Mapa, Conquistas, Ranking, Ajustes. O "Mapa" abre direto a galáxia da faixa da criança (`hooks/useJourney.ts`; sem faixa, `/galaxias`) e fica ativo também em `/faixas-etarias`, `/galaxias`, `/sistemas`, `/aulas` e `/laboratorios` (`match` + `isNavItemActive`).

## 5. Providers e localStorage (`app/providers.tsx`)

**Conquistas (24/10/2026):** catálogo e textos em `config/achievements.ts` (19, código = slug); regras em `lib/achievements.ts` (`earnedFromProgress`, `earnedFromRanking`; interpretações no topo do arquivo); gatilhos fora do progresso por `lib/achievementEvents.ts` (`unlockAchievement(slug)`, com fila até o provider ficar pronto): página 404 e caminho inexistente na aula G2 2.1 (S-02), suco de abacaxi (S-03, `components/space/PineappleJuice.tsx` no `AppShell`, desligado nas aulas/labs com `easterEgg={false}`), troca de personagem no perfil (C-01). O provider avalia as regras a cada mudança de progresso/sessão, olha o ranking (galáxia e sistemas com labs concluídos) 2,5 s depois de cada pontuação nova (só com conta) e mostra `AchievementToasts` (aviso escrito no canto de cima, 5 s, sem fala do Bonzi; mais de 3 de uma vez viram um aviso só).

A ordem de aninhamento é `SettingsProvider > ExplorerProvider > SessionProvider > ProgressProvider > AchievementsProvider > FlightProvider > SessionGate`. O Progress depende de Settings (`unlockAll`) e da sessão (dono do progresso); as conquistas dependem do progresso, da sessão e do explorador.

- **Login obrigatório (22/10/2026):** `components/auth/SessionGate.tsx` não mostra nenhuma página além de `/` e `/entrar` sem sessão (manda para `/entrar?voltar=<página>`; depois de sair da conta ou do modo visitante nesta aba, manda para `/entrar` sem `voltar` e apaga `rota404.parked` (`forgetParked`), para a próxima pessoa não cair na página nem na posição do foguete de quem saiu). `hooks/useSession.tsx` guarda `rota404.session` = `{token, user}` (conta) ou `{guest:true, id, age, ageRangeSlug, avatarSlug}` (visitante, só quando o servidor de contas não responde). API: `status` (loading|signed-in|guest|signed-out), `user`, `owner` (dono do progresso e das conquistas: id da conta, `guest:<id>` do visitante — cada "Jogar sem conta" é um visitante novo — ou null), `signup`, `login`, `playAsGuest`, `logout`, `updateUser`. Define o token do `apiClient` (`setAuthToken`) no render e confere `/users/me` ao carregar (401 encerra a sessão). O explorador espelha a conta (nome = apelido, personagem, faixa da idade).

Todos usam `hooks/useLocalStorage.ts`, que:
- lê no `useEffect`;
- grava JSON a cada mudança, só depois de hidratar;
- engole erros de storage;
- retorna `[value, set, hydrated]`.

Cada provider tem uma função `sanitize` que normaliza o que vem do storage.

| Chave | Hook / arquivo | Formato e padrões |
|---|---|---|
| `rota404.settings` | `hooks/useSettings.tsx` (`useSettings`) | `{narrationEnabled:true, soundEnabled:true, volume:70 (inteiro 0–100), showBonzi:true, reducedMotion:false, unlockAll:false}`. API: `updateSettings(partial)`, `resetSettings()`, `hydrated`. Com `reducedMotion` ligado, grava `data-reduced-motion="true"` no `<html>`. |
| `rota404.explorer` | `hooks/useExplorer.tsx` (`useExplorer`) | `{name:"Explorador" (máx. 24), avatarSlug:"castor", ageRangeSlug:null}`. API: `setName`, `setAvatar`, `setAgeRange`, `reset`, `hydrated`. `explorerDisplayName()` usa "Explorador" quando o nome está vazio. |
| `rota404.progress` | `hooks/useProgress.tsx` (`useProgress`) + `lib/progress.ts` | `{planets: {[planetId: UUID]: {status:"in_progress"|"completed", bestPoints?, lastPoints?, completedAt? (ISO)}}}`. API: `getPlanet`, `markStarted` (nunca rebaixa um planeta já registrado), `markCompleted(id, points?, mistakes?)` (com pontos atualiza `lastPoints` e `bestPoints = max`; `flawless` fica true se algum dia concluiu com 0 erros; `completions` conta as conclusões — os dois só neste aparelho, para as conquistas), `planetState(id, orderedIds)`, `completionRatio(ids)`, `completedCount(ids?)`, `totalPoints(ids?)` (soma de `bestPoints`), `resetProgress`, `hydrated` (storage **e** settings). |
| `rota404.achievements` | `hooks/useAchievements.tsx` (`useAchievements`) | `{owner, unlocked: {[slug]: ISO}}` (por dono, como o progresso). API: `ready`, `unlocked`, `isUnlocked(slug)`, `resetAchievements` (Ajustes > Apagar dados). Com conta: junta com `GET /achievements/me` ao entrar e grava cada nova com `POST /achievements/me` (o que falhar volta na próxima entrada). |

- Com conta, o progresso também vai para o servidor: `markStarted`/`markCompleted` disparam `PUT /progress/<id>` (lab concluído leva `points`), e ao entrar o provider busca `GET /progress`, junta com a cópia local (estado mais avançado, maior pontuação) e reenvia o que só existe aqui. A cópia local tem `owner` (id da conta ou "guest"): outra conta no aparelho começa do zero; até trocar o dono, `hydrated` fica false. `resetProgress` apaga só a cópia local. `markStarted` e `markCompleted` são chamados em `components/learning/runtime/LessonRuntime.tsx` e `LabRuntime.tsx`. A aula conclui sem pontos; o lab conclui com pontos.
- As chaves do progresso são os UUIDs dos planetas. `supabase/seed.sql` usa UUIDs fixos, então não troque ids de planetas: o progresso local deixaria de casar.

## 6. Progresso e desbloqueio sequencial
- **`lib/progress.ts`**:
  - `computePlanetState(planets, id, orderedIds, unlockAll)`: um registro local `completed` ou `in_progress` vence. Sem registro, o planeta fica `available` se for o primeiro do sistema, se o anterior estiver `completed`, se algum planeta seguinte do sistema já tiver registro (sem "buraco" bloqueado no meio, ex.: depois de desligar "Liberar todos") ou se `unlockAll` estiver ligado. Fora isso, fica `locked`.
  - `aggregateState(states)`: vazio ou nada iniciado dá `available`; tudo concluído dá `completed`; algum concluído ou em andamento dá `in_progress`.
  - `galaxyStateForExplorer(galaxy, ageRanges, slug)`: sem faixa escolhida, tudo `available`. Com faixa, galáxias de outra faixa ficam `locked`.
  - Pontuação e medalhas: `labScore(erros, segundos, {min, avg}, max)` em `frontend/lib/progress.ts` (fórmula da equipe, 22/10/2026): 1.000 por concluir + até 4.000 pelos erros (−1.000 cada) + até 5.000 pelo tempo (1ª metade de 2.500 cai de `min` até `avg`; 2ª metade cai de `avg` até 2 × `avg`). Total máximo 10.000 por lab (= `labs.max_score`), 80.000 por galáxia. Os tempos de cada lab ficam em `frontend/config/labTiming.ts` (estimativas: calibrar). `formatDuration`. `medalFor`: ouro ≥ 90%, prata ≥ 70%, bronze abaixo disso.
  - Mapas de rótulos e sprites: `PROGRESS_LABELS`, `PROGRESS_SPRITES`, `MEDAL_SPRITES`, `MEDAL_LABELS`.
- **`lib/planetSlots.ts`**: `sortPlanets` (por `order_index`), `galaxyPlanetIds`, `planetHref`, `buildPlanetSlots(system, stateOf?)`. Um sistema sem planetas gera 4 slots de prévia (`previa-1..4`, tipos lesson, lesson, lab, lab, `preview:true`).
- `PlanetScreen` (em `components/learning/`) bloqueia o acesso direto pela URL: se `planetState === "locked"`, mostra `LockedPlanet`.
- **Sistemas em sequência (24/10/2026)**: `isSystemUnlocked(planets, systemsPlanetIds, index, unlockAll)` (exposto como `useProgress().systemUnlocked`): o 1º sistema da galáxia sempre; os outros só com o anterior concluído, com `unlockAll` ou se já tiverem progresso. O mapa da galáxia mostra o sol bloqueado (o Bonzi usa a fala dublada "Conclua o planeta anterior para liberar este.": sem fala nova; o planeta anterior é o último do sistema anterior); a página do sistema e o `PlanetScreen` (acesso pela URL) buscam o detalhe da galáxia (cache `galaxy:<slug>`) e bloqueiam todos os planetas. `unlockAll` não libera galáxias de outra faixa etária.

## 7. Camada de API (`services/`)
- **`services/apiClient.ts`**:
  - **URL base**: `NEXT_PUBLIC_API_URL` (com `/` final removido, fixado no build) tem prioridade. Sem ela:
    - no servidor (SSR), usa `API_URL = http://localhost:9001/api`;
    - no navegador, `apiBaseUrl()` monta `${protocol}//${hostname}:9001/api` uma vez por carregamento. Um tablet que abre `http://192.168.0.10:9000` chama `http://192.168.0.10:9001/api`.
  - **`request`**: usa `fetch` com `cache: "no-store"` e `Accept: application/json`. Espera o envelope `{data}`; um erro HTTP vem como `{error:{code,message}}`.
  - **`ApiError(status, code, message)`**: falha de rede vira `status 0`/`network_error`; resposta sem `data` vira `invalid_response`.
  - **Helpers**: `isApiError`, `isNotImplemented` (501), `isNotFound` (404), `isNetworkError` (0), `getErrorMessage`.
  - **Cache de GET em memória** (só no navegador): vale para caminhos que casam com `CATALOG_PATH = /^\/(galaxies|systems|age-ranges|lessons|labs)/`. O TTL é de 5 min (`CATALOG_TTL_MS`). Reaproveita até a promise ainda em andamento (útil com o StrictMode). Erros não ficam no cache. `apiGet(path, params, {cache})` força ou desliga o cache; `clearApiCache(prefix?)` limpa.
  - Também exporta `apiPost`, `apiPut`, `apiPatch`, `apiDelete`, `setAuthToken` (cabeçalho `Authorization: Bearer`), `isUnauthorized` (401) e `isServiceDown` (rede ou 5xx).
- **`services/catalogService.ts`**: `getHealth`, `getAgeRanges`, `getAgeRange`, `getGalaxies({ageRange})` (query `age_range`), `getGalaxy`, `getGalaxyDetails(refs)` (paralelo; uma falha vira null), `getSystems({galaxy})`, `getSystem`.
- **`services/learningService.ts`**: `getLesson(ref)` e `getLab(ref)`, usados em `components/learning/runtime/planetContext.ts`. `listLessons` e `listLabs` existem, mas ninguém chama.
- **`services/gamificationService.ts`**: `getProgress`, `updateProgress(id, status, points?)`, `getGalaxyRanking`, `getSystemRanking` (com `me`), `getAchievements`/`getMyAchievements` (501). `getScores`/`submitScore` existem, mas não são chamados (501).
- **`services/userService.ts`**: `signup`, `login`, `logout`, `getCurrentUser`, `updateCurrentUser` (usados por `useSession`).
- **Estado conferido com curl na API em execução** (`data_source: supabase`):
  - respondem 200: `/health`, `/age-ranges`, `/galaxies`, `/systems`, `/lessons`, `/labs`;
  - respondem 501 `not_implemented`: só `/scores` (contas, progresso e ranking desde 22/10/2026; conquistas desde 24/10/2026: `getMyAchievements`, `unlockAchievement(slug)`).
- **`services/narrationService.ts`** (dublagem do Bonzi + voz do navegador, Web Speech API):
  - `speak(msg, {enabled, volume 0–100, owner, audioSrc})` cancela a fala anterior. Resolve ao terminar, ao ser interrompida, ou na hora quando não há suporte (no-op seguro).
  - **Dublagem (23/10/2026):** `config/bonziVoice.ts` liga cada fala gravada a um mp3 em `public/audio/bonzi/<grupo>/<nn>.mp3`
    (grupo = `g1-1-3`, `g2-4-2`, `tela-inicio`...). A busca ignora maiúsculas, aspas e espaços (`cleanForSpeech`). Ordem:
    a gravação da fala inteira; senão, uma gravação por pedaço (fim de frase ou "Rótulo: ") se TODOS os pedaços tiverem;
    senão, a voz do navegador na fala toda (nunca mistura as duas numa fala). Gravação que falha ao carregar → aquele
    pedaço com a voz do navegador. Valor livre (apelido, pontos, texto digitado): `config/bonziVoicePatterns.ts`, molde
    com `*` → gravação fixa (o apelido falado vira "viajante"). Importar gravações novas:
    `node scripts/importar-dublagem.cjs "<pasta com _indice.csv>" . --add` (na pasta frontend). Em desenvolvimento, o
    console mostra `[Bonzi] sem gravação: <texto>`.
    Sem gravação: falas com trecho variável (IP sorteado, `Ainda não. {need}`...) e a leitura do painel "O que fazer".
    Mudou o texto de uma fala no código? A gravação deixa de ser achada (volta a voz do navegador): regrave ou ajuste
    o texto em `bonziVoice.ts`.
  - Escolha de voz: pt-BR primeiro, depois qualquer pt. Nomes com `natural|online|google` vêm na frente. A voz fica em cache até o evento `voiceschanged`.
  - Parâmetros: `RATE 1.05`, `PITCH 1.15`. O texto é dividido em pedaços de até 180 caracteres por frase. A fala começa após 40 ms e chama `resume()` se a síntese estiver pausada.
  - `cleanForSpeech` remove tags, aspas, markdown, setas (que viram vírgula) e símbolos como ✓ ★ ▶.
  - `stop(owner)` só interrompe a fala daquele dono. `isNarrationSupported()` indica se há suporte.
  - `audioSrc` está reservado e não é usado.

## 8. Hooks
- **`hooks/useAsync.ts`**: `useAsync(fn, deps, {cacheKey})` retorna `{data, error, loading, notImplemented, notFound, reload}`.
  - `fn` **não** entra nas dependências; quem chama declara `deps` corretamente.
  - `cacheKey` liga um cache de resultados em memória (5 min, até 60 entradas, a mais antiga sai primeiro) para mostrar a página na hora ao voltar. Use só para catálogo e inclua na chave tudo de que `fn` depende (ex.: `system-page:${slug}`). `reload` apaga a chave.
- **`hooks/useTypewriter.ts`**: `useTypewriter(text, resetKey, animate)` retorna `{typedRef, typing}`.
  - Escreve 2 caracteres a cada 48 ms **direto no DOM**, então o componente não re-renderiza a cada letra.
  - O `<span ref={typedRef}>` precisa ficar **sem filhos** no JSX.
- **`hooks/useReducedMotion.ts`**: retorna `settings.reducedMotion` OU a media query `prefers-reduced-motion`. Usa `useSyncExternalStore` com uma única `MediaQueryList` global.
- `useLocalStorage`, `useSettings`, `useExplorer`, `useProgress`: veja a seção 5.

## 9. Assets: `config/assets.ts` (regra: toda imagem passa por aqui)
- Nenhum caminho `.png` fica fixo fora de `config/assets.ts`. Conferido com grep em `app/` e `components/`; só há comentários. Os arquivos ficam em `frontend/public/`, e todos os caminhos referenciados existem.
- **Estrutura**:
  - `SPRITES.{brand, ui, status, rewards, space, objects, placeholder}`. Exemplos: `SPRITES.ui.play`, `SPRITES.status.locked`, `SPRITES.objects.door404`.
  - `ELEMENTS` (~37 ícones de `/sprites/elements/*.png`, tipo `ElementKey`), usados pelos motores das aulas.
  - `BACKGROUNDS.{starfield, starfieldFar}`.
  - `ROCKET_FRAMES` (6 quadros).
  - `BONZI_FRAMES: Record<BonziState, string[]>`: poses paradas (não é animação). A primeira é a principal; as outras
    entram de vez em quando, uma a cada `BONZI_POSE_MS` (3 s), por troca direta de sprite. Pose repetida = mais tempo.
    - idle = 0, 0 e 1 (a pose 1 aparece 3 s a cada 9 s);
    - speaking = 0 e 4;
    - happy = 3;
    - thinking = 1 e 2;
    - warning = 2;
    - help = 4.
  - `AVATARS`: castor, ghost-spec, piaba (`native:34`), pucca, stormtrooper, tigrinho, amogus, hello-kitty (arquivo `hello_kitty.png`, campo `file`: o servidor só aceita a-z, 0-9 e hífen no slug), six-seven. `AVATAR_NATIVE_SIZE = 32`.
  - `BADGE_ART` (código → arte): só as medalhas ORIGINAIS (`comum-1..7`, `rara-1..5`, `lenda-1..4`), cada uma no máximo uma vez; Brutal (vermelha) e Secreta (verde-água) são originais com a cor trocada, geradas por `scripts/gerar-conquistas.py` (`b-01`, `b-02`, `s-01..s-03`; precisa de Pillow). `SPRITES.objects.pineappleJuice`: `/pineapple-juice.png` (caixinha 10x19, original, exibida em 3x).
  - `GALAXY_SPRITES` + `DEFAULT_GALAXY_SPRITE`.
  - `PLANET_SPRITES` (slug do planeta → `/planets/planet_g<galáxia>s<sistema>p<planeta>.png`, na ordem do catálogo: G1 = Internet e Web, G2 = API REST). O `sprite_key` dos planetas no banco não é mais usado.
  - `PLANET_PLACEHOLDERS` (por tipo lesson/lab).
  - `SYSTEM_SPRITES` (slug do sistema → sol `/suns/sun_g<galáxia>s<sistema>.png`, centro do sistema e nó no mapa da galáxia) + ciclo de fallback.
- **Resolvedores**:
  - `galaxySprite(slug)`, `systemSprite(slug, index)`;
  - `planetSprite(slug, type)`: arte pelo slug do planeta (`PlanetSlot.slug`, `PlanetNode slug`); sem slug conhecido, o placeholder do tipo;
  - `avatarSprite(slug)`, `badgeSprite(slug)`: se nada casar, usam `SPRITES.placeholder`.
- Asset novo: coloque o arquivo em `public/...`, crie a constante em `assets.ts` e use a constante no código.

## 10. Fontes e estilo
- **Fontes**: `app/layout.tsx` usa `next/font/google`.
  - `Press_Start_2P` (peso 400) fica em `--font-display`, usada em títulos h1–h4, botões e números.
  - `Pixelify_Sans` fica em `--font-body`, a fonte do corpo (18px).
  - Ambas com subsets latin e latin-ext e `display: swap`.
  - O **build precisa de internet**, porque as fontes são baixadas no build. Se o `next dev` subir sem internet, ele serve só a fonte de fallback (parece uma Arial esticada) até ser reiniciado com rede. Para rodar offline, faça o build com internet e leve a pasta `.next` pronta, ou migre para `next/font/local` (ainda não feito).
- **Maiúsculas acentuadas**: a Press Start 2P desenha mal as maiúsculas acentuadas. Com `text-transform: uppercase` aparece "LABORATóRIO", "PONTUAÇAO", "INíCIO".
  - Regra: nunca use `text-transform: uppercase` em texto com `var(--font-display)` (inclusive h1–h4) que possa ter acento.
  - Selos e rótulos pequenos em caixa alta usam Pixelify Sans: `ProgressStateBadge`, `MapNode .eyebrow` e `.previewTag`, tags das páginas.
  - Hoje a fonte display só aparece em caixa alta em textos sem acento: `Narrator .speaker` ("Bonzi") e `LabShell .feedbackLabel`.
  - Mesmo sem uppercase, o acento de "Á" em títulos fica pequeno, mas legível.
- **CSS**: CSS Modules por componente/página (`*.module.css`), sem Tailwind e sem libs de UI. Use `cx()` de `components/ui/cx.ts` para juntar classes.
- **Tokens em `app/globals.css` (`:root`)**:
  - cores: `--space-950/900/800/700`, `--nebula`, `--bonzi`, `--cyan`, `--blue`, `--yellow`, `--orange`, `--red`, `--green`, `--text`, `--text-dim`, `--panel-bg`, `--panel-border`, `--focus`;
  - `--px: 4px`;
  - bordas pixeladas feitas com 4 box-shadows: `--pixel-border`, `--pixel-border-cyan`, `--pixel-border-yellow`, `--pixel-bevel`;
  - layout: `--gutter`, `--content-max: 1360px`, `--hud-height: 76px`;
  - utilitários: `.sr-only`, `.skip-link`;
  - `-webkit-font-smoothing: none`.
- **Movimento reduzido**: a media query `prefers-reduced-motion` e `:root[data-reduced-motion="true"]` zeram animações e transições globalmente.
- **Pixel art**:
  - `Sprite` aplica `image-rendering: pixelated` por padrão (`.pixelated`).
  - Tamanhos sempre em múltiplos inteiros da arte nativa: a logo (`SPRITES.brand.logo` = assets/logo/logo_enhanced.png) é a arte de 173×72 ampliada ×5 e aparece na capa (múltiplos de 173 px). A barra do topo usa `SPRITES.brand.logoBar` (`logo-bar.png`, só o letreiro da mesma arte, sem foguete e estrelas: 155×29 nativo, exibido ×2 = 310×58; abaixo de 560 px vira o compass 25×27 ×2). A logo antiga (logo-small 153×27) não é mais usada (veja os comentários em `app/page.module.css` e `MainNav.module.css`). Avatares usam `pixelArtSize` em `Avatar.tsx`.
- **Otimizações deliberadas**, feitas para notebook fraco e iPad. Não reverta:
  - sem `backdrop-filter` (MainNav, PixelPanel);
  - `SpaceBackground` anda com `steps(512)`;
  - `AnimatedSprite` e `useTypewriter` trocam quadros e letras direto no DOM, sem render do React;
  - uma única MediaQueryList para movimento reduzido.

## 11. Componentes principais
- **`components/layout/AppShell.tsx`**:
  - Props: `{children, breadcrumbs?, bonzi?: BonziBuddyProps|null, variant?: "default"|"immersive", className?}`.
  - Renderiza o skip-link para `#conteudo`, `MainNav` (só na variante default), `Breadcrumbs` e `<main id="conteudo">`.
  - O Bonzi só aparece com `settings` hidratado, `bonzi` passado, `settings.showBonzi` ligado e `visible !== false`.
  - Quando o Bonzi flutua (posição diferente de inline), `.withBonzi` aplica `padding-bottom` de 150px (170px abaixo de 768px).
  - Toda página monta o próprio `AppShell` e passa o Bonzi por prop.
  - **`fit` (24/10/2026, "telas sem rolagem")**: a partir de 900px de largura a tela tem a altura da janela, o Bonzi
    flutua no canto sem reservar os 150px e os espaços encolhem. Usado em TODAS as páginas (início, mapas, planetas via
    `PlanetScreen`, perfil, conquistas, ranking, ajustes, universos, entrar). Se o conteúdo não couber, a página rola
    como antes (não corta nada). Abaixo de 900px nada muda.
- **`components/layout/FitToHeight.tsx`** (24/10/2026): bloco que ocupa a altura que sobra (dentro de `AppShell fit`) e
  encolhe o conteúdo por igual (`scale`, nunca aumenta; `minScale` 0,55) até caber. `align="center"` (mapas, universos)
  ou `"top"` (perfil, ajustes, conquistas). A escala é escrita no estilo pelo ResizeObserver (sem render, sem rAF).
  Medidas de tela dentro dele precisam desfazer a escala: `useRouteTravel` e `SpaceMap` dividem por
  `largura na tela / offsetWidth` (a nave e as ligações do mapa). Só age a partir de 900px.
- Telas sem rolagem, medidas (24/10/2026) em 1280×720, 1366×768, 1440×900 e 1920×1080: nenhuma página rola. Nos labs
  (LabShell, ≥1180px) a coluna lateral tem a altura do palco (`contain: size`) e rola por dentro quando precisa, com a
  área de interação presa embaixo (sempre à vista); a largura dela é a que o palco (16:9, limitado pela altura) não
  usa, até 480px (aula: até 440px). Ranking: a lista rola por dentro. Ajustes em 3 colunas; perfil em 2×2; conquistas
  bloqueadas em versão compacta (`AchievementBadge compact`) com os grupos lado a lado; cadastro em duas colunas.
- **`components/layout/StatusView.tsx`**:
  - Props: `kind: "loading"|"error"|"empty"|"not-found"|"coming-soon"`, `title?`, `message?`, `onRetry?`, `action?{label, href}`.
  - Tem textos e artes padrão (o loading mostra o foguete).
  - Usa `role="alert"` para erro e `status` para o resto.
- **`components/layout/SpaceBackground.tsx`**: Server Component. Fundo fixo com nebulosa, duas camadas de estrelas e vinheta.
- **`components/navigation/MainNav.tsx`**: HUD sticky com logo (link para `/`), `NAV_ITEMS` como `SpriteButton variant="ghost"` com `active` e um chip de perfil (Avatar + nome).
- **`components/navigation/Breadcrumbs.tsx`**: items `{label, href?}`. O último item recebe `aria-current="page"`. Até 560 px a trilha vira um botão "Voltar para <nível de cima>" (`compact="back"`, padrão) ou some (`compact="hide"`, usado nas aulas/labs, que já têm "Voltar ao sistema"); `AppShell breadcrumbsCompact` repassa.
- **`components/space/MapNode.tsx` `highlight`** (repassado por GalaxyNode, SystemNode e PlanetNode): marca o próximo passo do mapa com legenda de borda amarela (o anel amarelo atrás da arte saiu em 24/10/2026, a pedido da equipe) e a etiqueta "Próximo" (seta `SPRITES.ui.next`); o `aria-label` ganha "próximo passo". Um destino por mapa: a galáxia da criança, o primeiro sistema não concluído, o primeiro planeta disponível ou em andamento.
- **`hooks/useJourney.ts`**: `{mapHref, nextHref}`. A galáxia da criança (a única liberada pela faixa) e o próximo planeta a fazer (primeiro disponível/em andamento, sistema por sistema). Usa os caches `galaxies+age-ranges` e `galaxy:<slug>`.
- **`components/bonzi/BonziBuddy.tsx`**:
  - Props: `message?`, `messageKey?` (mude para repetir a mesma fala), `state?: idle|speaking|happy|thinking|warning|help` (padrão idle), `visible?`, `position?: bottom-right|bottom-left|top-right|inline` (padrão bottom-right), `audioSrc?`, `onClose?`, `onSpeechEnd?`, `size?` (padrão 120).
  - Poses e balão:
    - Sem animação de movimento na figura (decisão de 23/10/2026: a arte são sprites, não animações). Só troca de pose
      a cada `BONZI_POSE_MS` (`AnimatedSprite` com fps = 1000 / BONZI_POSE_MS); com movimento reduzido, só a pose principal.
    - Enquanto digita, idle e speaking exibem as poses de speaking.
    - O balão recolhe sozinho após 8 s (`AUTO_COLLAPSE_MS`), só quando flutuante, depois de terminar a digitação e se o foco não estiver dentro do balão.
    - Clicar na figura alterna o balão. O X recolhe, ou chama `onClose` se ele existir.
  - Fala: só depois de hidratar, respeitando `settings.narrationEnabled`. O volume é lido de um ref, então vale a partir da próxima fala. O dono da fala é um `useId`.
  - Acessibilidade e layout:
    - O texto completo fica em `.sr-only` dentro de `aria-live="polite"`.
    - O texto "ghost" reserva o espaço do balão; o texto digitado fica `aria-hidden`.
    - Abaixo de 768px o sprite tem no máximo 72px.
    - `position="inline"` é usado em `components/learning/Narrator.tsx`.
- **`components/ui/Sprite.tsx`**: `<img>` com `src`, `alt`, `size` (width), `height`, `pixelated=true`, `decorative` (alt vazio + aria-hidden) e `draggable={false}`.
- **`components/ui/AnimatedSprite.tsx`** (memo): props `frames`, `fps=6`, `playing`, `alt`, `size`. Empilha os quadros e troca a classe `.current` via DOM. Pausa com a aba oculta e fica parado com movimento reduzido. Aceita fps abaixo de 1 (mínimo 0,1), usado nas poses do Bonzi.
- **`components/ui/SpriteButton.tsx`**:
  - Props: `{sprite, label, href?, onClick?, showLabel=true, size=32, active, disabled, variant: default|primary|ghost, attention, focusOnAttention, className}`.
  - Renderiza `<Link>` (com href e não desabilitado), `<span role="link" aria-disabled>` (href desabilitado) ou `<button>`.
  - `attention` (ignorado quando disabled) aplica a classe `.attention`: anel amarelo pulsando (só opacidade, sem crescer: crescer passava da borda da janela e fazia a tela tremer) e ícone empurrando para frente.
  - `focusOnAttention` chama `revealFocus` quando `attention` liga.
  - `showLabel=false` vira `aria-label` + `title`.
  - `active` vira `aria-current` em links e `aria-pressed` em botões.
- **`components/ui/revealFocus.ts`**: `revealFocus(el)` faz `focus({preventScroll:true})` e só rola (`scrollIntoView nearest`) se o elemento estiver fora da janela (margem de 12px). A rolagem é instantânea com movimento reduzido. Também é usado em motores de `components/learning`.
- **Outros componentes de `components/ui`**:
  - `PixelPanel`: `title`, `as` (section/div/aside), `tone` (default/highlight/muted).
  - `SpriteToggle`: `role="switch"` com `checked`, `onChange`, `label`, `description`, `spriteOn` e `spriteOff`.
- **`components/space/SpaceMap.tsx`**:
  - Props: `{nodes: {id, x%, y%, content, locked?}[], edges?: [id, id][] (padrão: corrente sequencial), rocketAt?, aspectRatio=16/9, ariaLabel, className}`.
  - Mede os nós com `ResizeObserver` e ancora em `[data-map-anchor]`. Trata o layout empilhado (`position: static` no mobile).
  - Desenha `Connection` (trilha de pontos, estado locked/active) e um `Rocket` que voa entre nós, inclinando durante 900 ms.
- **`components/space/MapNode.tsx`**:
  - Props: `{kind: galaxy|system|planet, sprite, name, label?, state, size, href?, onLockedClick?, eyebrow?, footer?, preview?, orbit?, delay?}`.
  - Vira `<button>` quando bloqueado e com `onLockedClick`, `<Link>` quando tem href e está liberado, ou `<div>` nos outros casos.
  - Monta o `aria-label` com rótulo, nome, estado e "prévia", e define as CSS vars `--node-size` e `--node-delay`.
  - Wrappers: `GalaxyNode` (220px, barra de 8 segmentos), `SystemNode` (150px, orbit, 6 segmentos, "Sistema NN"), `PlanetNode` (tag Aula/Laboratório, `PLANET_TYPE_LABELS`).
- **`components/space/Rocket.tsx`**: props `size`, `flying`, `angle`. Anima `ROCKET_FRAMES` a 10 fps.
- **`components/avatar/`**: `Avatar` (`slug`, `size`, `label`, `framed`) e `AvatarPicker` (radiogroup com `value` e `onChange`).
- **`components/progress/`**: `ProgressBar` (`value` 0–1, `label`, `segments=10`, `showValue`, `role="progressbar"`) e `ProgressStateBadge` (`state`, `showLabel`, `size`).
- **`components/gamification/`**:
  - `AchievementBadge` (`name`, `sprite`, `rarity`, `unlocked`, `description`; exporta `RARITY_LABELS`);
  - `RankingBoard` (`entries`, `title`, `emptyMessage`): pódio para os 3 primeiros e lista a partir do 4º;
  - `ScoreCounter` (`points|null`, `label`, `size: sm|md|lg`) e `formatPoints()`, que usa `.` como separador de milhar.

## 12. Tipos (`types/domain.ts`)
- Entidades: `AgeRange`, `Galaxy`, `PlanetarySystem`, `Planet` (`type: "lesson"|"lab"`, `sprite_key`, `order_index`).
- Detalhes: `GalaxyDetail` (`age_range`, `systems[].planets?`), `PlanetarySystemDetail` (`galaxy`, `planets`), `LessonDetail` e `LabDetail` (`planet`, `system`).
- Conteúdo: `Lesson.content{code?, engine?, central_idea?}` e `Lab.config{code?, type?, engine?}` + `max_score`.
- Estados e gamificação: `ProgressState` (locked|available|in_progress|completed), `Achievement` (rarity comum|rara|lenda), `RankingEntry`, `Ranking`, `User`, `Avatar`, `HealthStatus`.
- Bonzi: `BonziState`, `BonziPosition`.
- Todos os campos estão em snake_case, iguais aos da API.


## Armadilhas
- O progresso, o perfil e os ajustes ficam SÓ no localStorage do navegador (rota404.progress, rota404.explorer, rota404.settings). (Nota antiga, de antes das contas: hoje só /scores responde 501.) Os endpoints /progress, /scores, /users/me, /achievements e /rankings respondiam 501. updateProgress, submitScore e o userService inteiro existem, mas nenhum código os chama. Trocar de navegador ou de tablet zera o progresso.
- Chaves de progresso = UUID do planeta. supabase/seed.sql usa UUIDs fixos; não regere ids de planetas, ou o progresso salvo deixa de casar.
- Press Start 2P (var(--font-display), inclusive h1–h4) desenha mal maiúsculas acentuadas ('LABORATóRIO', 'PONTUAÇAO'). Nunca use text-transform: uppercase com essa fonte em texto que possa ter acento. Para rótulos em caixa alta use a fonte do corpo (Pixelify Sans).
- next/font/google baixa as fontes no build e no início do dev: o build precisa de internet. Se o next dev subiu offline, ele serve só a fonte de fallback (aparência de Arial esticada) até ser reiniciado com rede. Para rodar offline, leve o .next já buildado ou migre para next/font/local.
- Toda página é "use client", mas é pré-renderizada no servidor: o localStorage só é lido em useEffect. Respeite os flags `hydrated` (useSettings, useExplorer, useProgress) antes de mostrar estado salvo, senão aparece mismatch ou um flash de estado errado.
- useAsync NÃO observa `fn`: declare todas as dependências reais em `deps` e coloque-as também no `cacheKey`. Use cacheKey só para catálogo (nunca para progresso, pontos ou ranking).
- Há dois caches em memória de 5 min no frontend: o apiClient guarda GETs que casam com /galaxies|systems|age-ranges|lessons|labs, e o useAsync guarda resultados (máx. 60). O Flask tem outro cache de catálogo (CATALOG_CACHE_SECONDS, padrão 3600 s). Conteúdo novo no banco só aparece após reiniciar a API e recarregar a página. O comentário 'Mesmo TTL do cache do Flask' em services/apiClient.ts está desatualizado (5 min no front contra 3600 s no back).
- Resolução da URL da API: NEXT_PUBLIC_API_URL (fixada no build) tem prioridade; sem ela, o navegador usa <mesmo host da página>:9001/api. NÃO defina NEXT_PUBLIC_API_URL=http://localhost:9001/api se tablets ou celulares vão acessar: no tablet, localhost é o próprio aparelho. Mudou a variável? Rode npm run build de novo. O README ainda manda definir a variável para a rede local, mas pela derivação pelo host isso deixou de ser necessário.
- Para outros dispositivos use npm run build + npm run start: next dev bloqueia outras origens e next.config.ts não define allowedDevOrigins.
- next.config.ts tem agentRules: false de propósito (impede o next dev 16 de gerar AGENTS.md sozinho). reactStrictMode: true duplica efeitos no dev; o cache de promises do apiClient evita requisições em dobro.
- Toda imagem passa por frontend/config/assets.ts (SPRITES, ELEMENTS, PLANET_SPRITES, BONZI_FRAMES, AVATARS, BADGE_ART...). Não escreva caminhos .png direto em componentes. Toda a arte de public/ é a original da equipe (24/10/2026: public espelhado do pacote deles; só o áudio e as 5 medalhas recoloridas vêm de outro lugar). next/image não é usado: imagens são <img> via components/ui/Sprite (pixelated por padrão) e devem ter tamanho em múltiplos inteiros da arte nativa.
- settings.soundEnabled é salvo e tem toggle, mas não há nenhum efeito sonoro implementado (só narração). O volume só afeta a narração e passa a valer na próxima fala (BonziBuddy lê via ref).
- unlockAll ("modo apresentação" em /configuracoes) libera sistemas e planetas; galáxias de outra faixa etária continuam bloqueadas por galaxyStateForExplorer.
- Rotas /aulas/[id] e /laboratorios/[id] recebem o ID DO PLANETA (não o da aula) mais ?sistema=<slug>. Usam useSearchParams, por isso a página precisa do <Suspense>. Sistemas sem planetas mostram 4 slots de prévia com ids 'previa-1..4'.
- Otimizações de desempenho intencionais (notebook fraco, iPad) que não devem ser revertidas: sem backdrop-filter, SpaceBackground com steps(512), AnimatedSprite e useTypewriter alterando o DOM direto sem setState por quadro ou letra, uma única MediaQueryList em useReducedMotion. No useTypewriter, o <span ref={typedRef}> deve ficar sem filhos no JSX.
- Não há ESLint nem testes no frontend; a única verificação é `npm run typecheck` (passa limpo hoje). tsconfig usa incremental: o tsc grava tsconfig.tsbuildinfo (está no .gitignore).
- Windows: o caminho do projeto tem espaços e acentos (OneDrive ... Área de Trabalho); use caminhos absolutos entre aspas em todos os comandos.
