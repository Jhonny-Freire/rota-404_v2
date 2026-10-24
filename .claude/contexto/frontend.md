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
npm run dev          # http://localhost:3000 (só no próprio PC; next dev bloqueia outros dispositivos sem allowedDevOrigins)
npm run build        # PRECISA DE INTERNET: next/font/google baixa as fontes no build
npm run start        # produção (use build+start para tablets/celulares na rede)
npm run typecheck
```
- No Windows o caminho tem espaços e acentos, então use sempre caminhos absolutos entre aspas.
- A API Flask precisa estar no ar em `:5000`. Veja `README.md` e `backend/`.

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
| `/` | `app/page.tsx` | Landing. `AppShell variant="immersive"` (sem MainNav). Logo, botões "Iniciar viagem" (→ `/faixas-etarias`) e "Ver mapa" (→ `/galaxias`), atalhos (Perfil + itens de `NAV_ITEMS` menos Mapa), trilha Galáxias/Sistemas/Planetas. |
| `/faixas-etarias` | `app/faixas-etarias/page.tsx` | Chama `getAgeRanges()` e `getGalaxies()` (cacheKey `age-ranges+galaxies`). Cada faixa vira um "portal" com suas galáxias. Escolher chama `setAgeRange(slug)` e depois `router.push('/galaxias')`. |
| `/galaxias` | `app/galaxias/page.tsx` | `SpaceMap` com as galáxias, sem arestas (`edges=[]`). O estado vem de `galaxyStateForExplorer`. O progresso por galáxia vem de `getGalaxyDetails(slugs)` + `galaxyPlanetIds`. Clicar numa galáxia bloqueada liga um aviso do Bonzi. Tem legenda de estados e botão "Trocar faixa". |
| `/galaxias/[galaxySlug]` | `app/galaxias/[galaxySlug]/page.tsx` | `getGalaxy(slug)`. Os sistemas são ordenados por `order_index` e posicionados em zigue-zague (`pathPosition`). O estado do sistema é `aggregateState` dos planetas. O foguete fica no primeiro sistema que ainda não chegou a 100%. |
| `/sistemas/[systemSlug]` | `app/sistemas/[systemSlug]/page.tsx` | `loadSystem` busca `getSystem` e `getSystems()` em paralelo (os vizinhos servem para os botões anterior/próximo). Planetas em órbita (`orbitPosition`, 120px) vêm de `buildPlanetSlots`. `SystemHud` mostra os pontos (só labs), a coleção de planetas com selo e o contador concluídos/total. "Próximo sistema" ganha `attention` quando o sistema está completo. Clicar num planeta bloqueado faz o Bonzi avisar (usa `messageKey` para repetir a fala). |
| `/aulas/[id]?sistema=<slug>` | `app/aulas/[id]/page.tsx` | `<Suspense>` + `PlanetScreen kind="lesson"`. Precisa de Suspense porque usa `useSearchParams`. |
| `/laboratorios/[id]?sistema=<slug>` | `app/laboratorios/[id]/page.tsx` | Igual à anterior, com `kind="lab"`. |
| `/perfil` | `app/perfil/page.tsx` | Nome (máx. 24), `AvatarPicker`, faixa etária, planetas concluídos, `ScoreCounter` total, progresso por galáxia e 4 badges de prévia, todos bloqueados ("???"). |
| `/conquistas` | `app/conquistas/page.tsx` | `getAchievements()` + `getMyAchievements()`. Se a API responder 501, cai para a lista local `BADGES`, toda bloqueada. As conquistas são agrupadas por raridade. |
| `/ranking` | `app/ranking/page.tsx` | Abas acessíveis "Por galáxia" e "Por sistema" (setas, Home e End). `RankingResult` chama `getGalaxyRanking` ou `getSystemRanking`. Com 501, `RankingBoard` fica vazio e mostra `StatusView coming-soon`. |
| `/configuracoes` | `app/configuracoes/page.tsx` | Nome, faixa, toggles (narração, efeitos sonoros, volume 0–100 em passos de 5, mostrar Bonzi, reduzir animações, `unlockAll` "modo apresentação"). "Apagar dados locais" pede um segundo clique e chama `reset()` + `resetSettings()` + `resetProgress()`. |
| 404 | `app/not-found.tsx` | Porta 404 e botões Início/Mapa. |

- A rota de aula/lab recebe o **id do planeta**: `lib/planetSlots.ts → planetHref(type, planet.id, system.slug)` gera `ROUTES.lesson(id, systemSlug)` ou `ROUTES.lab(...)`, com `?sistema=` na query. Segundo `learningService`, a API aceita id ou slug da aula/lab ou do planeta.
- Os itens do menu estão em `config/navigation.ts → NAV_ITEMS`: Mapa, Conquistas, Ranking, Ajustes. O item "Mapa" fica ativo também em `/faixas-etarias`, `/galaxias`, `/sistemas`, `/aulas` e `/laboratorios` (`match` + `isNavItemActive`).

## 5. Providers e localStorage (`app/providers.tsx`)
A ordem de aninhamento é `SettingsProvider > ExplorerProvider > ProgressProvider`. O Progress depende de Settings por causa de `unlockAll`.

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
| `rota404.progress` | `hooks/useProgress.tsx` (`useProgress`) + `lib/progress.ts` | `{planets: {[planetId: UUID]: {status:"in_progress"|"completed", bestPoints?, lastPoints?, completedAt? (ISO)}}}`. API: `getPlanet`, `markStarted` (nunca rebaixa um planeta já registrado), `markCompleted(id, points?)` (com pontos atualiza `lastPoints` e `bestPoints = max`), `planetState(id, orderedIds)`, `completionRatio(ids)`, `completedCount(ids?)`, `totalPoints(ids?)` (soma de `bestPoints`), `resetProgress`, `hydrated` (storage **e** settings). |

- O progresso fica **só no navegador**. `markStarted` e `markCompleted` são chamados em `components/learning/runtime/LessonRuntime.tsx` e `LabRuntime.tsx`. A aula conclui sem pontos; o lab conclui com pontos.
- As chaves do progresso são os UUIDs dos planetas. `supabase/seed.sql` usa UUIDs fixos, então não troque ids de planetas: o progresso local deixaria de casar.

## 6. Progresso e desbloqueio sequencial
- **`lib/progress.ts`**:
  - `computePlanetState(planets, id, orderedIds, unlockAll)`: um registro local `completed` ou `in_progress` vence. Sem registro, o planeta fica `available` se for o primeiro do sistema, se o anterior estiver `completed` ou se `unlockAll` estiver ligado. Fora isso, fica `locked`.
  - `aggregateState(states)`: vazio ou nada iniciado dá `available`; tudo concluído dá `completed`; algum concluído ou em andamento dá `in_progress`.
  - `galaxyStateForExplorer(galaxy, ageRanges, slug)`: sem faixa escolhida, tudo `available`. Com faixa, galáxias de outra faixa ficam `locked`.
  - Pontuação e medalhas: `labPoints(max, erros) = max(ceil(50% max), max − 10×erros)` (`MISTAKE_PENALTY=10`). `medalFor`: ouro ≥ 90%, prata ≥ 70%, bronze abaixo disso.
  - Mapas de rótulos e sprites: `PROGRESS_LABELS`, `PROGRESS_SPRITES`, `MEDAL_SPRITES`, `MEDAL_LABELS`.
- **`lib/planetSlots.ts`**: `sortPlanets` (por `order_index`), `galaxyPlanetIds`, `planetHref`, `buildPlanetSlots(system, stateOf?)`. Um sistema sem planetas gera 4 slots de prévia (`previa-1..4`, tipos lesson, lesson, lab, lab, `preview:true`).
- `PlanetScreen` (em `components/learning/`) bloqueia o acesso direto pela URL: se `planetState === "locked"`, mostra `LockedPlanet`.
- Sistemas nunca ficam bloqueados. `unlockAll` não libera galáxias de outra faixa etária.

## 7. Camada de API (`services/`)
- **`services/apiClient.ts`**:
  - **URL base**: `NEXT_PUBLIC_API_URL` (com `/` final removido, fixado no build) tem prioridade. Sem ela:
    - no servidor (SSR), usa `API_URL = http://localhost:5000/api`;
    - no navegador, `apiBaseUrl()` monta `${protocol}//${hostname}:5000/api` uma vez por carregamento. Um tablet que abre `http://192.168.0.10:3000` chama `http://192.168.0.10:5000/api`.
  - **`request`**: usa `fetch` com `cache: "no-store"` e `Accept: application/json`. Espera o envelope `{data}`; um erro HTTP vem como `{error:{code,message}}`.
  - **`ApiError(status, code, message)`**: falha de rede vira `status 0`/`network_error`; resposta sem `data` vira `invalid_response`.
  - **Helpers**: `isApiError`, `isNotImplemented` (501), `isNotFound` (404), `isNetworkError` (0), `getErrorMessage`.
  - **Cache de GET em memória** (só no navegador): vale para caminhos que casam com `CATALOG_PATH = /^\/(galaxies|systems|age-ranges|lessons|labs)/`. O TTL é de 5 min (`CATALOG_TTL_MS`). Reaproveita até a promise ainda em andamento (útil com o StrictMode). Erros não ficam no cache. `apiGet(path, params, {cache})` força ou desliga o cache; `clearApiCache(prefix?)` limpa.
  - Também exporta `apiPost`, `apiPut` e `apiPatch`.
- **`services/catalogService.ts`**: `getHealth`, `getAgeRanges`, `getAgeRange`, `getGalaxies({ageRange})` (query `age_range`), `getGalaxy`, `getGalaxyDetails(refs)` (paralelo; uma falha vira null), `getSystems({galaxy})`, `getSystem`.
- **`services/learningService.ts`**: `getLesson(ref)` e `getLab(ref)`, usados em `components/learning/runtime/planetContext.ts`. `listLessons` e `listLabs` existem, mas ninguém chama.
- **`services/gamificationService.ts`**: `getAchievements`, `getMyAchievements`, `getGalaxyRanking` e `getSystemRanking` são usados. `getProgress`, `updateProgress`, `getScores` e `submitScore` existem, mas **não são chamados**.
- **`services/userService.ts`**: `getCurrentUser`, `createUser`, `updateCurrentUser`. **Não são usados.**
- **Estado conferido com curl na API em execução** (`data_source: supabase`):
  - respondem 200: `/health`, `/age-ranges`, `/galaxies`, `/systems`, `/lessons`, `/labs`;
  - respondem 501 `not_implemented`: `/achievements`, `/achievements/me`, `/progress`, `/scores`, `/users/me`, `/rankings/...`.
- **`services/narrationService.ts`** (voz do navegador, Web Speech API):
  - `speak(msg, {enabled, volume 0–100, owner, audioSrc})` cancela a fala anterior. Resolve ao terminar, ao ser interrompida, ou na hora quando não há suporte (no-op seguro).
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
  - `BONZI_FRAMES: Record<BonziState, string[]>`:
    - idle = bonzi-0;
    - speaking = 0 e 4;
    - happy = 3;
    - thinking = 1 e 2;
    - warning = 2;
    - help = 4.
  - `AVATARS`: castor, ghost-spec, piaba (`native:34`), pucca, stormtrooper, tigrinho. `AVATAR_NATIVE_SIZE = 32`.
  - `BADGES`: comum ×7, rara ×5, lenda ×4 (`/sprites/badges/<raridade>-<n>.png`).
  - `GALAXY_SPRITES` + `DEFAULT_GALAXY_SPRITE`.
  - `PLANET_SPRITES`: chaves nomeadas (api, deploy, dns, erro404, hashing, https) e `planet-N`. **Não existe `planet-2`.**
  - `PLANET_PLACEHOLDERS` (por tipo lesson/lab).
  - `SYSTEM_SPRITES` (por slug) + ciclo de fallback.
- **Resolvedores**:
  - `galaxySprite(slug)`, `systemSprite(slug, index)`;
  - `planetSprite(spriteKey, type)`: aceita `planet-<n>`, `planet-<nome>` e `<nome>`; se nada casar, usa o placeholder do tipo;
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
  - Tamanhos sempre em múltiplos inteiros da arte nativa: a logo é 173×72 (×5), a logo-small 153×27 e o compass 25×27 (veja os comentários em `app/page.module.css` e `MainNav.module.css`). Avatares usam `pixelArtSize` em `Avatar.tsx`.
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
- **`components/layout/StatusView.tsx`**:
  - Props: `kind: "loading"|"error"|"empty"|"not-found"|"coming-soon"`, `title?`, `message?`, `onRetry?`, `action?{label, href}`.
  - Tem textos e artes padrão (o loading mostra o foguete).
  - Usa `role="alert"` para erro e `status` para o resto.
- **`components/layout/SpaceBackground.tsx`**: Server Component. Fundo fixo com nebulosa, duas camadas de estrelas e vinheta.
- **`components/navigation/MainNav.tsx`**: HUD sticky com logo (link para `/`), `NAV_ITEMS` como `SpriteButton variant="ghost"` com `active` e um chip de perfil (Avatar + nome).
- **`components/navigation/Breadcrumbs.tsx`**: items `{label, href?}`. O último item recebe `aria-current="page"`.
- **`components/bonzi/BonziBuddy.tsx`**:
  - Props: `message?`, `messageKey?` (mude para repetir a mesma fala), `state?: idle|speaking|happy|thinking|warning|help` (padrão idle), `visible?`, `position?: bottom-right|bottom-left|top-right|inline` (padrão bottom-right), `audioSrc?`, `onClose?`, `onSpeechEnd?`, `size?` (padrão 120).
  - Animação e balão:
    - FPS por estado (speaking 5, thinking 1.5, demais 1).
    - Enquanto digita, idle e speaking exibem os quadros de speaking.
    - O balão recolhe sozinho após 8 s (`AUTO_COLLAPSE_MS`), só quando flutuante, depois de terminar a digitação e se o foco não estiver dentro do balão.
    - Clicar na figura alterna o balão. O X recolhe, ou chama `onClose` se ele existir.
  - Fala: só depois de hidratar, respeitando `settings.narrationEnabled`. O volume é lido de um ref, então vale a partir da próxima fala. O dono da fala é um `useId`.
  - Acessibilidade e layout:
    - O texto completo fica em `.sr-only` dentro de `aria-live="polite"`.
    - O texto "ghost" reserva o espaço do balão; o texto digitado fica `aria-hidden`.
    - Abaixo de 768px o sprite tem no máximo 72px.
    - `position="inline"` é usado em `components/learning/Narrator.tsx`.
- **`components/ui/Sprite.tsx`**: `<img>` com `src`, `alt`, `size` (width), `height`, `pixelated=true`, `decorative` (alt vazio + aria-hidden) e `draggable={false}`.
- **`components/ui/AnimatedSprite.tsx`** (memo): props `frames`, `fps=6`, `playing`, `alt`, `size`. Empilha os quadros e troca a classe `.current` via DOM. Pausa com a aba oculta e fica parado com movimento reduzido.
- **`components/ui/SpriteButton.tsx`**:
  - Props: `{sprite, label, href?, onClick?, showLabel=true, size=32, active, disabled, variant: default|primary|ghost, attention, focusOnAttention, className}`.
  - Renderiza `<Link>` (com href e não desabilitado), `<span role="link" aria-disabled>` (href desabilitado) ou `<button>`.
  - `attention` (ignorado quando disabled) aplica a classe `.attention`: anel amarelo pulsando e ícone empurrando para frente.
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
- O progresso, o perfil e os ajustes ficam SÓ no localStorage do navegador (rota404.progress, rota404.explorer, rota404.settings). Os endpoints /progress, /scores, /users/me, /achievements e /rankings respondem 501 hoje. updateProgress, submitScore e o userService inteiro existem, mas nenhum código os chama. Trocar de navegador ou de tablet zera o progresso.
- Chaves de progresso = UUID do planeta. supabase/seed.sql usa UUIDs fixos; não regere ids de planetas, ou o progresso salvo deixa de casar.
- Press Start 2P (var(--font-display), inclusive h1–h4) desenha mal maiúsculas acentuadas ('LABORATóRIO', 'PONTUAÇAO'). Nunca use text-transform: uppercase com essa fonte em texto que possa ter acento. Para rótulos em caixa alta use a fonte do corpo (Pixelify Sans).
- next/font/google baixa as fontes no build e no início do dev: o build precisa de internet. Se o next dev subiu offline, ele serve só a fonte de fallback (aparência de Arial esticada) até ser reiniciado com rede. Para rodar offline, leve o .next já buildado ou migre para next/font/local.
- Toda página é "use client", mas é pré-renderizada no servidor: o localStorage só é lido em useEffect. Respeite os flags `hydrated` (useSettings, useExplorer, useProgress) antes de mostrar estado salvo, senão aparece mismatch ou um flash de estado errado.
- useAsync NÃO observa `fn`: declare todas as dependências reais em `deps` e coloque-as também no `cacheKey`. Use cacheKey só para catálogo (nunca para progresso, pontos ou ranking).
- Há dois caches em memória de 5 min no frontend: o apiClient guarda GETs que casam com /galaxies|systems|age-ranges|lessons|labs, e o useAsync guarda resultados (máx. 60). O Flask tem outro cache de catálogo (CATALOG_CACHE_SECONDS, padrão 3600 s). Conteúdo novo no banco só aparece após reiniciar a API e recarregar a página. O comentário 'Mesmo TTL do cache do Flask' em services/apiClient.ts está desatualizado (5 min no front contra 3600 s no back).
- Resolução da URL da API: NEXT_PUBLIC_API_URL (fixada no build) tem prioridade; sem ela, o navegador usa <mesmo host da página>:5000/api. NÃO defina NEXT_PUBLIC_API_URL=http://localhost:5000/api se tablets ou celulares vão acessar: no tablet, localhost é o próprio aparelho. Mudou a variável? Rode npm run build de novo. O README ainda manda definir a variável para a rede local, mas pela derivação pelo host isso deixou de ser necessário.
- Para outros dispositivos use npm run build + npm run start: next dev bloqueia outras origens e next.config.ts não define allowedDevOrigins.
- next.config.ts tem agentRules: false de propósito (impede o next dev 16 de gerar AGENTS.md sozinho). reactStrictMode: true duplica efeitos no dev; o cache de promises do apiClient evita requisições em dobro.
- Toda imagem passa por frontend/config/assets.ts (SPRITES, ELEMENTS, PLANET_SPRITES, BONZI_FRAMES, AVATARS, BADGES...). Não escreva caminhos .png direto em componentes. Não existe /planets/planet-2.png. next/image não é usado: imagens são <img> via components/ui/Sprite (pixelated por padrão) e devem ter tamanho em múltiplos inteiros da arte nativa.
- settings.soundEnabled é salvo e tem toggle, mas não há nenhum efeito sonoro implementado (só narração). O volume só afeta a narração e passa a valer na próxima fala (BonziBuddy lê via ref).
- unlockAll ('modo apresentação' em /configuracoes) libera só planetas; galáxias de outra faixa etária continuam bloqueadas por galaxyStateForExplorer. Sistemas nunca ficam bloqueados.
- Rotas /aulas/[id] e /laboratorios/[id] recebem o ID DO PLANETA (não o da aula) mais ?sistema=<slug>. Usam useSearchParams, por isso a página precisa do <Suspense>. Sistemas sem planetas mostram 4 slots de prévia com ids 'previa-1..4'.
- Otimizações de desempenho intencionais (notebook fraco, iPad) que não devem ser revertidas: sem backdrop-filter, SpaceBackground com steps(512), AnimatedSprite e useTypewriter alterando o DOM direto sem setState por quadro ou letra, uma única MediaQueryList em useReducedMotion. No useTypewriter, o <span ref={typedRef}> deve ficar sem filhos no JSX.
- Não há ESLint nem testes no frontend; a única verificação é `npm run typecheck` (passa limpo hoje). tsconfig usa incremental: o tsc grava tsconfig.tsbuildinfo (está no .gitignore).
- Windows: o caminho do projeto tem espaços e acentos (OneDrive ... Área de Trabalho); use caminhos absolutos entre aspas em todos os comandos.
