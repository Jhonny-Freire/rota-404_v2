<!-- Referência detalhada gerada a partir da leitura do código em 17/10/2026. Se o código mudar, atualize este arquivo. -->
# Ficha técnica: runtime de aulas e laboratórios, shells e kit de cena

Tudo foi conferido no código atual. `npx tsc --noEmit` em `frontend/` passa sem erros (o script `npm run typecheck` faz o mesmo). Os caminhos são relativos à raiz do projeto, e `@/` aponta para `frontend/`.

## 1. Rotas e entrada

- `frontend/app/aulas/[id]/page.tsx` renderiza `<PlanetScreen kind="lesson" />`, e `frontend/app/laboratorios/[id]/page.tsx` renderiza `<PlanetScreen kind="lab" />`. As duas páginas são `"use client"` e ficam dentro de um `<Suspense>`, porque a tela usa `useSearchParams`. O fallback é `AppShell` com `StatusView` ("Preparando a aula" ou "Montando o laboratório").
- `frontend/components/learning/PlanetScreen.tsx` funciona assim:
  - Lê `params.id` e o parâmetro `?sistema=<slug>`.
  - Chama `useAsync(() => loadPlanetContext(kind, id, systemSlug), …, { cacheKey: planetContextKey(...) })`.
  - Mostra "loading" até `progress.hydrated`.
  - Se não achar o planeta, mostra `StatusView kind="not-found"`. Em caso de erro, mostra `StatusView kind="error"` com `onRetry` e o Bonzi em "warning".
  - Se `progress.planetState(planet.id, orderedIds) === "locked"`, mostra `<LockedPlanet>`. O texto é "Conclua o planeta anterior para liberar este.".
  - Nos demais casos, renderiza `<LessonRuntime key={planet.id}>` ou `<LabRuntime key={planet.id} maxScore>`.
  - Props comuns: `engineKey`, `planetId`, `title`, `tags=[`Planeta ${code}`]`, `preview = source==="preview"`, `backHref` (o sistema ou as galáxias), `backLabel` e `nextPlanet`. Também monta os breadcrumbs.
- `frontend/components/learning/runtime/planetContext.ts`, função `loadPlanetContext(kind, ref, systemSlug?)`, devolve um `PlanetContext {kind,title,code,engineKey,maxScore,planet,system,orderedPlanets,nextPlanet,source:"api"|"catalog"|"preview"}`.
  - Busca `getLesson` ou `getLab` com `withRetry`. A única nova tentativa acontece em 503, depois de 450 ms. Quando há `?sistema=`, o sistema é buscado em paralelo.
  - Se a API responder 501 ou 404, ele usa o planeta do catálogo e o resultado tem `source:"catalog"`.
  - Refs no formato `previa-N` sem dados retornam `source:"preview"` com `engineKey:null`.
  - **Chave do motor:** `engineKey = (content|config).engine ?? planet.slug`.
  - O título perde o prefixo de código: a regex `^(\d+(?:\.\d+)+)\s+` remove o "1.1 ".
  - `code = extra.code ?? código do título ?? código do nome`.
  - `maxScore = detail.max_score > 0 ? max_score : 100`.
  - `nextPlanet` é o planeta seguinte em `sortPlanets`, com `href = planetHref(type,id,system.slug)`.
- Na API local (`GET /api/lessons` e `/api/labs`), `content.engine` e `config.engine` são iguais ao slug do planeta nos 16 planetas. As aulas são 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1 e 4.2. Os labs são 1.3, 1.4, 2.3, 2.4, 3.3, 3.4, 4.3 e 4.4, todos com `max_score` 100. Os tipos ficam em `frontend/types/domain.ts`: `LessonContent{code?,engine?,central_idea?}`, `LabConfig{code?,type?,engine?}`, `LessonDetail` e `LabDetail`, estes dois com `planet` e `system`.

## 2. Contrato dos motores (`frontend/components/learning/runtime/types.ts`)

Os motores importam só tipos de `@/components/learning/runtime`, cujo `index.ts` reexporta tudo, incluindo `LessonRuntime`, `LabRuntime`, `useEngineModule` e `loadPlanetContext`.

```ts
type SayOptions = { afterCurrent?: boolean }; // true: entra na fila e só fala quando a fala atual terminar
type Say = (message: string, state?: BonziState, options?: SayOptions) => void; // padrão "speaking"; repetir a frase fala de novo
// BonziState = "idle"|"speaking"|"happy"|"thinking"|"warning"|"help" (types/domain.ts)

type LessonEngineProps = {
  scene: number;                       // 0-based, índice em meta.scenes
  say: Say;
  setCanAdvance: (ready: boolean) => void; // libera "Próxima cena"/"Concluir"; o shell zera a cada troca de cena
  next: () => void;                    // avança; na última cena conclui a aula
  setHint: (text: string | null) => void;  // troca o texto "O que fazer"; null volta a meta.hints[cena]
  reducedMotion: boolean;
};
type LessonEngineMeta = { kind: "lesson"; scenes: string[]; hints?: string[] };

type LabFeedbackTone = "success" | "error" | "info" | "hint";
type LabFeedback = { tone: LabFeedbackTone; message: string } | null; // null limpa
type PortalSlot = ComponentType<{ children: ReactNode }>;
type LabEngineProps = {
  attempt: number;     // 0,1,2… muda a cada "Jogar de novo"; use em useSeededRandom(attempt)
  maxScore: number;    // labs.max_score (100)
  say: Say;
  feedback: (fb: LabFeedback) => void;
  setStep: (index: number) => void;   // etapa atual (índice em meta.steps)
  mistake: () => void;  // penalidade
  finish: () => void;   // conclui com a pontuação atual
  reducedMotion: boolean;
  Stage: PortalSlot;        // portal para o palco 16:9 (ponha um <SceneCanvas> dentro)
  Interaction: PortalSlot;  // portal para o painel "Área de interação"
};
type LabEngineMeta = { kind: "lab"; steps: string[] };

type EngineMeta = LessonEngineMeta | LabEngineMeta;
type LessonEngineModule = { default: ComponentType<LessonEngineProps>; meta: LessonEngineMeta };
type LabEngineModule    = { default: ComponentType<LabEngineProps>;    meta: LabEngineMeta };
type EngineModule = LessonEngineModule | LabEngineModule;
type EngineLoader = () => Promise<EngineModule>;
isLessonModule(mod) / isLabModule(mod)   // checam mod.meta?.kind
type NextPlanetLink = { href: string; name: string };
```

- Todas as funções passadas ao motor têm identidade estável, porque são `useCallback` sem deps. Por isso podem entrar em deps de `useEffect`.
- Um módulo de motor tem `export const meta` e um `export default` com o componente, e começa com `"use client"`.
- `hints[i]` traz a instrução inicial da cena i: curta e no imperativo ("Toque em um aparelho.", "Observe a foto viajar.").

## 3. Registro e carregamento

- `frontend/components/learning/engines/index.ts` declara `ENGINES: Record<string, EngineLoader>`, onde cada chave aponta para `() => import("./<slug>")`. O arquivo também exporta `ENGINE_KEYS`, `hasEngine(key)` (que usa `hasOwnProperty`) e `getEngineLoader(key)`.
- **Registrados (16, a Galáxia 1 inteira):**
  - S1: `o-que-e-uma-rede`, `como-meu-dispositivo-chega-a-internet`, `conectando-uma-rede` (lab) e `missao-recuperar-a-conexao` (lab).
  - S2: `todo-dispositivo-precisa-de-um-endereco`, `ip-dominio-e-site`, `encontrando-o-destino` (lab) e `missao-encontrar-o-servidor` (lab).
  - S3 (20/10/2026): `o-que-acontece-quando-acesso-um-site`, `html-os-blocos-de-uma-pagina`, `monte-sua-pagina` (lab) e `conserte-a-pagina` (lab).
  - S4 (20/10/2026): `como-as-informacoes-viajam`, `http-e-https`, `detetive-digital` (lab) e `missao-navegacao-segura` (lab).
- **Não há mais stubs.** `PlaceholderLessonEngine`/`PlaceholderLabEngine` continuam em `runtime/placeholders.tsx` para planetas futuros.
  - Cada stub cita a especificação que o motor real deve seguir, por exemplo `G1 - Internet e Web/S3 - Navegador e páginas Web/aula3-1.md`. Há um `.md` por planeta em `G1 - Internet e Web/S1..S4/` (`aulaX-Y.md` e `labX-Y.md`).
- `runtime/useEngineModule.ts`, função `useEngineModule(engineKey)`, devolve `{status:"loading"|"ready"|"missing"|"error", module, error?}`.
  - Sem loader no registro, o status vira `"missing"`.
  - O loader é validado: `default` precisa ser função ou objeto (memo e forwardRef passam) e `meta.kind` precisa ser `"lesson"` ou `"lab"`. Se falhar, o status vira `"error"` com "Motor inválido".
  - Um cache de módulo (`Map loaded`) guarda os motores já carregados na visita. Voltar a uma aula pula o "Preparando a cena", mas o loader roda de novo para pegar a versão nova depois de um HMR.
- `runtime/LessonRuntime.tsx` e `runtime/LabRuntime.tsx`:
  - Chamam `useEngineModule(engineKey)`. Em `loading` mostram `StatusView` ("Preparando a cena" ou "Montando o laboratório").
  - Fazem `mod = isLessonModule(...)` (ou `isLabModule`) e `trackedId = mod ? planetId : null`.
  - `useEffect` chama `markStarted(trackedId)` quando `hydrated`.
  - Lesson: passa `allScenesOpen = getPlanet(id)?.status === "completed"` e `onComplete → markCompleted(id)`.
  - Lab: passa `bestPoints = getPlanet(id)?.bestPoints ?? null`, `maxScore = maxScore > 0 ? maxScore : 100` e `onFinish(points) → markCompleted(id, points)`.
- **Modo prévia.** Quando o motor está ausente, inválido, deu erro ou tem kind diferente do planeta, o shell recebe `preview` (etiqueta "Prévia" no `ShellHeader`) e um motor provisório:
  - Aula: `PreviewLessonEngine` com `PREVIEW_LESSON_META` (cenas "Abertura", "Exploração", "Desafio").
  - Lab: `PreviewLabEngine` com `PREVIEW_LAB_META` (etapas "Observar", "Testar", "Concluir").
  - Os dois ficam em `runtime/placeholders.tsx`.
  - **Na prévia nada entra no progresso:** não há `markStarted` nem `markCompleted`, o próximo planeta não é liberado e `bestPoints` é null.
  - `PlaceholderLessonEngine` mostra "Cena em construção" e libera o avanço depois de cerca de 900 ms (`useSequence([900])`).
  - `PlaceholderLabEngine` tem os botões "Próxima etapa"/"Concluir" e "Simular erro" (este chama `mistake`).

### Como criar um motor novo

1. Crie `frontend/components/learning/engines/<slug>/index.tsx` (ou substitua o stub). Ele precisa de `"use client"`, `export const meta: LessonEngineMeta | LabEngineMeta` e `export default function …(props)`.
2. Registre a chave em `ENGINES`. A chave tem de ser igual a `content.engine` ou `config.engine`, que hoje é o slug do planeta.
3. Importe os tipos de `@/components/learning/runtime` e as primitivas de `@/components/learning/kit`. Se precisar, coloque um `*.module.css` próprio na pasta.

## 4. Shell de AULA (`frontend/components/learning/LessonShell.tsx`)

- **Props:** `title`, `tags`, `preview`, `meta`, `Engine`, `backHref`, `backLabel`, `nextPlanet`, `allScenesOpen` e `onComplete`.
- **Motor memoizado:** `EngineView = useMemo(() => memo(Engine), [Engine])`. O motor só re-renderiza quando muda `scene` ou `reducedMotion`, ou pelo próprio estado. Fala, dica e "pronto" do shell não re-renderizam a cena.
- **Renderização:** `<SceneStage label="Cena X de N: título" ready={ready} frameRef={stageRef}><EngineBoundary key={run}><EngineView …/></EngineBoundary></SceneStage>`. O motor **não é remontado** ao trocar de cena. A convenção é renderizar um subcomponente por cena com `key`, por exemplo `{scene === 0 && <Cena1 key="intro" …/>}` ou `const Scene = SCENES[i]; <Scene key={i} …/>`.
- **Estado:** `scene`, `visited` (a maior cena já vista), `ready`, `completed`, `run`, `line` (fala do Narrator) e `hint`.
- **Troca de cena (`goTo`):** limita o índice ao intervalo válido, faz `setReady(false)`, zera `hint` e atualiza `visited = max(visited, target)`.
- **Liberar o avanço:** `canNext = (ready && !speaking) || allScenesOpen || scene < visited`, com `speaking = useBonziSpeaking()` (estado REAL da voz). Ao voltar para uma cena já vista, dá para avançar sem refazê-la. Com a cena pronta e o Bonzi ainda falando, o painel diz "Muito bem! Escute o Bonzi até o fim." e o botão só chama atenção quando a fala acaba. `next()` do motor também espera a fala terminar (`whenIdle`) e só avança se a cena não mudou (revisão de UX de 20/10: o Bonzi era cortado no meio da frase).
- **Painel "O que fazer":**
  - O texto vem de `hint ?? meta.hints?.[scene] ?? DEFAULT_HINT`, sendo `DEFAULT_HINT = "Acompanhe a cena e siga as dicas do Bonzi."`.
  - Quando `ready`, o rótulo muda para "Cena concluída", o ícone para `ELEMENTS.ok` (antes era `magnifier`) e o texto para `Muito bem! Agora toque em "Próxima cena".`, ou `"Concluir"` na última cena.
  - `setHint` faz trim, e uma string vazia vira null.
- **Foco e atenção:**
  - O botão principal é um `SpriteButton` com `attention={ready}` e `focusOnAttention`. Quando o botão chama atenção e está habilitado, `revealFocus` (`components/ui/revealFocus.ts`) move o foco para ele e rola a página só se ele estiver fora da tela.
  - `SceneStage ready` faz os cantos do palco ficarem amarelos e piscarem.
  - Ao navegar pelas setas ou pelos números das cenas, o foco vai para a moldura do palco (`tabIndex=-1`), porque o botão "Próxima cena" fica desabilitado.
- **Pausa antes de liberar:** é convenção dos motores, o shell não faz isso. O motor chama `setCanAdvance(true)` depois de uma pausa de leitura `{hold}`, por exemplo `timers.after(READY_PAUSE_MS=1400, () => setCanAdvance(true), {hold:true})` em `engines/como-meu-dispositivo-chega-a-internet/parts.ts`. Assim o aluno vê o resultado antes de o foco pular para o botão.
- **Controles:** "Cena anterior" (só ícone, desabilitado na cena 0) e "Próxima cena" ou "Concluir". Na última cena o ícone é `ELEMENTS.ok` e o clique chama `complete`. A trilha numerada só deixa clicar em cenas abertas (`allScenesOpen || i <= visited`) e diferentes da atual. Há também uma `ProgressBar` só para leitor de tela.
- **Conclusão (`complete`):** faz `completed=true`, o Bonzi diz "Aula concluída! Você mandou muito bem." em "happy" e `onComplete()` é chamado. `next()` do motor na última cena também chama `complete`.
  - O `CompletionPanel` mostra troféu, "Aula concluída!" e as ações "Próximo planeta" (primária, se houver), "Voltar ao sistema" (primária quando não há próximo) e "Rever aula". As ações ficam no pé do painel: as secundárias à esquerda e a primária no canto inferior direito.
  - "Rever aula" volta para a cena 0, zera `ready` e `hint` e faz `run+1`, o que remonta o `EngineBoundary`. `visited` não é zerado.
- **Narrator:** a variante `balloon` (padrão, 96 px) mostra o `BonziBuddy` inline. Se o ajuste "Mostrar o Bonzi" estiver desligado, aparece só o texto.

## 5. Shell de LABORATÓRIO (`frontend/components/learning/LabShell.tsx`)

- **Props:** `title`, `tags`, `preview`, `meta`, `Engine`, `maxScore`, `bestPoints`, `backHref`, `backLabel`, `nextPlanet` e `onFinish(points)`. O motor é memoizado do mesmo jeito: `useMemo(() => memo(Engine))`.
- **Portais:**
  - O motor é renderizado dentro de `<div className={styles.engineHost}>`, que tem `display:none`. Esse div fica envolto em `<PortalTargets stage interaction>` (`runtime/portals.tsx`).
  - `Stage` e `Interaction` fazem `createPortal` para o `.content` do `SceneStage` (`contentRef`, com `showPlaceholder={false}`) e para o div do painel "Área de interação".
  - **O que ficar fora de `<Stage>` ou `<Interaction>` não aparece.** No primeiro render os alvos ainda são null e os portais retornam null.
  - Se a interação estiver vazia, o painel mostra "Use o palco para jogar.".
- **Remontagem:** o motor fica dentro de `<EngineBoundary key={attempt} wrap={(n) => <Stage>{n}</Stage>}>`. Ele é remontado a cada "Jogar de novo" e desmontado quando sai o resultado (`!result &&`).
- **`setStep(i)`:** grava `max(0, floor(i))`, sem limite superior. No stepper, `done = result!==null || i < step` e `current = i===step`. Chamar `setStep(meta.steps.length)` marca todas as etapas como feitas. Os motores atuais fazem isso ao acertar, antes do `finish`. Com mais de 4 etapas o stepper recebe a classe `stepperLong`.
- **`feedback(fb)`:** o painel do guia mostra o Narrator `variant="portrait"` com `size={60}`. A mensagem vem embaixo, com ícone e rótulo de acordo com o tom:

  | Tom | Rótulo | Ícone (tamanho) |
  |---|---|---|
  | `hint` | "O que fazer" | `question` (28) |
  | `info` | "Acompanhe" | `magnifier` (26) |
  | `error` | "Ops!" | `error` (22) |
  | `success` | "Muito bem!" | `ok` (22) |

  A moldura só muda de cor em `error` (vermelho) e `success` (verde). O bloco tem `key={tone:message}`, então repetir exatamente a mesma mensagem não reanima.
- **Pontuação:** `labScore(erros, segundos, {min, avg}, max)` em `frontend/lib/progress.ts` (fórmula da equipe, 22/10/2026): 1.000 por concluir + até 4.000 pelos erros (−1.000 cada) + até 5.000 pelo tempo (1ª metade de 2.500 cai de `min` até `avg`; 2ª metade cai de `avg` até 2 × `avg`). Total máximo 10.000 por lab (= `labs.max_score`), 80.000 por galáxia. Os tempos de cada lab ficam em `frontend/config/labTiming.ts` (estimativas: calibrar). O LabShell tem um cronômetro por tentativa (só conta com a aba visível; para no `finish()` do motor, antes da espera pela última fala) e o HUD mostra Tempo (tique de 1 s num componente próprio, `LiveHud`) e Erros. Os Pontos só aparecem no HUD depois da conclusão (decisão de 23/10/2026: ver a pontuação caindo durante o jogo desanima); o cálculo é feito só no `finish()`.
  - `mistake()` é ignorado depois do `finish`.
  - O HUD ("Placar do laboratório") fica no `ShellHeader aside` e mostra "Tempo" e "Erro(s)"; "Pontos" (`formatPoints`) entra só com o resultado.
- **`finish()`:** é idempotente por tentativa (`finishedRef`).
  - Calcula `labScore(erros, segundos, timing, max)`, `previousBest = bestPoints` (a prop) e `medal = medalFor(total, max)` (ouro ≥ 90%, prata ≥ 70%, bronze o resto). A tela de resultado mostra a conta: Conclusão, Erros (n) e Tempo (m:ss).
  - O Bonzi diz "Laboratório concluído! Você fez N pontos." em "happy" e `onFinish(final)` é chamado. A tela de resultado só aparece quando a fala anterior do motor termina (`whenIdle(12000)`, conferindo que a tentativa é a mesma).
  - `markCompleted(id, points)` grava `lastPoints` e `bestPoints = max(...)` em localStorage `rota404.progress` (`hooks/useProgress.tsx`).
- **Tela de conclusão:** mostra a medalha (`MEDAL_SPRITES` e `MEDAL_LABELS`), o título "Novo recorde!" (só quando `previousBest !== null && points > previousBest`) ou "Laboratório concluído!", um `ScoreCounter` com "de N pontos" e "Melhor pontuação". As ações são "Jogar de novo", "Próximo planeta" (primária) e "Voltar ao sistema".
- **"Jogar de novo" (`playAgain`):** zera `mistakes`, `step`, `fb`, `result`, a fala e `finishedRef`, e faz `attempt+1`. O motor é remontado com um `attempt` novo, que gera uma variação nova via `useSeededRandom`.

## 6. Componentes de apoio

- `SceneStage.tsx`: moldura 16:9. Mede `--stage-top` com `useLayoutEffect`, `ResizeObserver(document.body)` e `resize`. A largura é `min(100%, max(--stage-min 320px, (100svh − --stage-top − --stage-bottom)*16/9))`. Props: `children`, `contentRef`, `showPlaceholder`, `placeholderSprite`, `placeholderLabel`, `label`, `ready`, `frameRef` e `className`. Os shells definem `--stage-bottom` (66 px, ou 110/120 px abaixo de 1180 px de largura).
- `ShellHeader.tsx`: props `kind` ("lesson" ou "lab"), `title`, `tags`, `preview`, `aside` e `back{href,label}`. Mostra uma etiqueta "AULA · Planeta 1.1", "Prévia" quando for o caso, e o botão de voltar com `SPRITES.ui.map`.
- `Narrator.tsx`: exporta `NarratorLine {message,state,key}` e `EMPTY_LINE`. A variante "balloon" usa `BonziBuddy position="inline"`. A variante "portrait" usa `AnimatedSprite` com `BONZI_FRAMES[state]`, digita o texto com `useTypewriter` (instantâneo com movimento reduzido) e fala com `narrationService.speak(text,{enabled,volume,owner})`. A voz respeita os ajustes `narrationEnabled`, `volume` e `showBonzi` de `hooks/useSettings.tsx`.
- `CompletionPanel.tsx`: `CompletionAction {label,sprite,href?,onClick?,primary?}`. A ação primária recebe `attention` e `focusOnAttention`, ou seja, ganha foco ao abrir, e vai para o canto inferior direito (`styles.forward`).
- **Repetir fala:** o `BonziBuddy` (cabeçalho do balão) e o `Narrator` portrait têm um botão "Repetir" (`SPRITES.ui.soundOn`, aria-label "Repetir fala do Bonzi") que digita e fala de novo a última frase.
- **Fila de falas do Bonzi** (`components/learning/useBonziLine.ts`, 23/10/2026): o `say` dos shells (aula e lab) põe a fala numa FILA. Uma fala nova nunca corta a atual: espera a voz terminar (`whenSilent`), uma pausa curta e, sem voz, o tempo de leitura (45 ms por letra). Fila de até 3 falas (com toques rápidos saem as mais antigas; a mesma fala repetida em seguida não entra). `afterCurrent` virou o comportamento padrão. `reset()` (troca de cena na aula, "Rever aula", "Jogar de novo" no lab) esvazia a fila e corta a voz da cena anterior; é o ÚNICO corte proposital, além dos botões "Repetir"/"Ouvir". O "Repetir" da aula fala de novo TODAS as falas da cena (`sayAll`), não só a última.
- **Estado da voz:** `services/narrationService.ts` expõe `isSpeaking()` (= OCUPADO: voz falando OU falas na fila do shell, via `setPendingLines`), `subscribeSpeaking()`, `whenIdle(maxMs=15000)` (fim da fala E da fila: `next()`, `finish`, `useSpeech.afterSpeech` e o "Próxima cena" esperam a fila toda), `whenSilent()` (fim da voz atual, usado pela fila) e `yieldBackground()` (a leitura de apoio termina a FRASE atual e cede a vez). A fala tem um vigia (`texto.length*120 + 4000` ms) para nunca travar se o navegador não disparar `end`. `hooks/useBonziSpeaking.ts` lê esse estado com `useSyncExternalStore`.
- **Leitura do painel do guia** (`components/learning/GuideVoice.tsx`, 23/10/2026): `useGuideVoice(texto, falaDoBonzi)` lê em voz alta o "O que fazer" da aula (`guideText`, menos "Escute o Bonzi até o fim") e o feedback do laboratório (`fb.message`), uma vez por texto novo, 1,5 s depois + `whenIdle` (a fala do Bonzi da cena nova chega ~0,7 s depois da troca: com 350 ms a instrução começava antes e era cortada) + `yieldBackground` (texto novo não corta a leitura anterior). Texto igual à fala do Bonzi não é repetido. Usa `speak({background:true})`: leitura de apoio que NÃO conta como ocupado, então não segura `canNext`, `next()` nem os `whenIdle` dos motores. É falada frase por frase: quando o Bonzi tem fala nova, a leitura termina a frase atual e para (nada é cortado no meio da frase). `ListenButton` ("Ouvir") repete o texto. Respeita `narrationEnabled`, `showBonzi` e `volume`.
- `LockedPlanet.tsx`: props `title`, `backHref` e `backLabel`.
- `runtime/EngineBoundary.tsx`: class component `ErrorBoundary`. Quando um motor quebra, mostra "Ops! Esta cena encontrou um problema." e o botão "Tentar de novo", que reseta o boundary. Também registra `console.error("[Rota 404] Falha no motor da cena:")`.

## 7. Kit de cena (`frontend/components/learning/kit/index.ts`)

**Unidade do kit.** Dentro do `<SceneCanvas>`, `size`, `width`, `thickness` e `maxWidth` valem 1 = 1% da largura do canvas, porque `--kit-u: 1cqw` e o canvas é `container-type: inline-size`. Fora do canvas, por exemplo no painel Interaction, cada componente usa `--u: var(--kit-u, 8px)`, e então 1 = 8 px. As exceções são `Place`, `Link` e `Packet`, cujo fallback é 1cqw: eles só funcionam dentro do canvas.

**Coordenadas.** `x`, `y`, `from`, `to` e `path` estão em % do canvas (0 a 100). O eixo y usa `--kit-vu = 1cqw/ratio`.

**Sprites.** Use `element` com uma chave `ElementKey` de `ELEMENTS` (`config/assets.ts`) ou `src` com um caminho de `config/assets`. As chaves de `ELEMENTS` são: box, boxGold, boxEmpty, cellphone, tablet, notebook, pc, monitor, setup, printer, server, serverError, router, wifi, cable, internet, cloudUpload, webpage, mail, photo, house, pin, magnifier, question, ok, error, lockClosed, lockOpen, key, gateClosed, gateOpen, door, hacker, robot, person, camera e microphone.

### Primitivas exportadas (props principais)

**Cena e posicionamento**
- **SceneCanvas** `{children,label(role=group),ratio=16/9,backdrop:"none"|"grid"|"floor",className,style}`: a área relativa da cena. É a raiz da cena de uma aula ou o conteúdo de `<Stage>` num lab.
- **Place** `{x,y,anchor:"center"|"top"|"bottom"|"left"|"right"|"top-left"|"top-right"|"bottom-left"|"bottom-right",z(padrão 2; Link 1, Packet 3),width(unidades do kit),moveMs=0(anima x/y),hidden(fade + inert + aria-hidden)}`: posiciona o filho em (x%, y%).
- **SceneSprite** `{element|src,alt,label(legenda visível),size=10,highlighted,dimmed,selected,correct,wrong(tremida),pulse,mark=true,flip,onClick(vira <button>),disabled,pressed,children(sobreposição)}`.

**Linhas, pacotes e cadeias**
- **Link** (também exportado como `SceneLink`, para não colidir com `next/link`) `{from,to,state:"idle"|"active"|"broken"|"off",reverse,thickness=0.8,speedMs=1400,dots=3,label,breakMark=true,ratio,z}`: linha pixelada. No estado active os pontos correm, exceto com movimento reduzido. No estado broken aparece o sprite de erro no meio.
- **Packet** `{path:ScenePoint[],element="box"|src,size=5,durationMs=1600(dividido pelos trechos conforme o comprimento),delayMs,stopAt(índice do ponto de falha),blocked,loop,loopPauseMs=400,hideOnArrive,onArrive,onReach(i),label,alt,ratio,z}`: anda por `setTimeout`, nunca por animationend. Para repetir a viagem, troque a `key`. Com movimento reduzido ele salta direto.
- **FlowChain** `{items:FlowItem{id,label,element?,src?,missing?,content?}[],current,reached,hiddenArrows:number[],onItemClick,size=7,wrap,ariaLabel}`: cadeia "A → B → C" com setas de sprite (`SPRITES.ui.next`). Um item `missing` aparece como "?" tracejado.

**Textos e caixas**
- **Tag** `{children,tone:KitTone,size:"sm"|"md"|"lg",highlighted,strike,icon(ElementKey)|iconSrc,onClick(vira botão),pressed,disabled,ariaLabel}`: etiqueta mono para IPs, domínios, "<h1>" e afins.
- **StageBanner** `{text,tone="info",icon,reducedMotion(OBRIGATÓRIO),y=9,maxWidth=80,live=true}`: faixa de instrução no topo do palco (Place x=50, z=6). A região viva é estável e só a Tag remonta para fazer o "pop".
- **Callout** `{tone,tail:"none"|"up"|"down"|"left"|"right",size,maxWidth=34,live}`: caixa de texto curta sobre a cena.
- **Balloon** `{tail="bottom-left"|…|"none",thought,tone:"light"|"danger"|"success",size,maxWidth=30,live}`: balão de fala ou de pensamento.

**Interações com correção**
- **ChoiceGrid** `{choices:Choice{id,label?,element?,src?,content?,ariaLabel?}[],mode:"single"|"multiple",correct?:string[],onResult(ChoiceResult{correct,selected,wrong,missing}),onSelect(id),confirmLabel="Confirmar",columns(até 4),size=8,disabled,retryMs=1200,ariaLabel}`.
  - Sem `correct`, funciona como exploração livre.
  - Um acerto trava a grade.
  - Um erro marca o cartão por `retryMs` (hold) e depois libera nova tentativa sem revelar a resposta.
  - Para reiniciar, troque a `key`.
- **OrderCards** `{items:OrderItem{id,label,element?,src?,ariaLabel?}[],correctOrder,onResult(OrderResult{correct,order,firstWrong}),onChange(order),checkLabel="Verificar",direction:"row"|"column",size=7,showNumbers=true,disabled,retryMs=1400,ariaLabel}`.
  - O cartão pode ser movido pelas setas próprias, tocando dois cartões para trocá-los, pelas setas do teclado ou arrastando.
  - `items` só define a ordem inicial: embaralhe antes com `rand.shuffle(items,"k",true)`.
- **Família de arrastar e soltar:**
  - **DragBoard** `{items:DragBoardItem{id,label,element?,src?,content?}[],zones:DragBoardZone{id,label,hint?}[],value|defaultValue:Record<itemId,zoneId>(ausente = POOL_ZONE "pool"),onChange,onDrop(itemId,zoneId)→false recusa,itemStatus,zoneStatus,poolLabel="Peças",layout:"side"|"stack"(padrão stack),size=7,disabled}`: versão pronta com origem e zonas. **Não aceita `onSelect`.**
  - **DragProvider** `{onMove:DragMoveHandler(itemId,zoneId)=>boolean|void(false = a peça treme 700 ms e fica onde estava),disabled,onSelect?(id|null)}`: base para layouts livres. `onSelect` não dispara na montagem e serve para trocar a dica quando uma peça é selecionada.
  - **DragPiece** `{id,label,element|src,size=7,hideLabel,children,status:MarkStatus,disabled}`.
  - **DropZone** `{id,label,hideLabel,children,status:"correct"|"wrong"|"highlight",layout:"wrap"|"stack"|"free",emptyHint,bare}`.
  - Peças e zonas podem ficar em portais diferentes, desde que dentro do mesmo provider. Fora de um provider, o componente lança um erro.
  - Uma peça pode ser movida arrastando ou tocando a peça e depois a zona (ou com Enter). Escape cancela a seleção.
  - O "fantasma" do arraste é um portal em `document.body`. A zona sob o dedo é detectada por `elementFromPoint` com `[data-kit-zone]`.

**Navegador e páginas**
- **BrowserFrame** `{url,children,secure(cadeado),highlight:"none"|"url"|"protocol",loading,tabTitle,actionLabel,onAction,actionDisabled,actionPulse,minHeight(unidades do kit)}`.
- **PagePreview** `{children,label="Prévia da página",dense,theme:"light"|"dark"}`.
- **Block** `{kind:"title"|"text"|"image"|"button"|"input"|"link",text,showTag,tag,state:"normal"|"highlighted"|"dimmed"|"selected"|"correct"|"wrong",misplaced,missing,imageElement="photo"|imageSrc,onClick,ariaLabel}`. Constantes: `BLOCK_TAGS` (title "<h1>", text "<p>", image "<img>", button "<button>", input "<input>", link "<a>") e `BLOCK_LABELS` (rótulos em pt-BR).

**Botões e entrada de texto**
- **ActionButton** `{label,onClick,element|sprite(padrão SPRITES.ui.play),variant:"primary"(padrão)|"default"|"ghost",disabled,size=24 (em px),attention,focusOnAttention}`: envolve o `SpriteButton`.
- **AnswerInput** `{label,onSubmit(value)=>boolean|void,placeholder,submitLabel="Enviar",inputMode:"text"|"numeric"|"decimal",maxLength=40,mono=true,disabled,autoFocus}`. O valor chega com trim. `true` marca certo e trava o campo. `false` marca errado por 1200 ms (hold) e mantém o texto.

**Hooks de tempo**
- **useSequence(steps: SequenceStep[], {play=true,reducedMotion?,onStep?,onDone?})** → `{step,done,restart,skipToEnd}`.
  - Um `SequenceStep` é `number` (animação, vira 0 ms com movimento reduzido) ou `{hold:ms}` (pausa de leitura, mantida).
  - `step` vai de 0 até `steps.length`.
  - Mudar a assinatura dos passos, ou passar `play` de false para true, recomeça a sequência.
  - Todos os timers são limpos no unmount.
- **useTimers({reducedMotion?})** → `{after(ms, fn, {hold?}) → cancelador, clearAll}`. O objeto é estável e tudo é cancelado no unmount.
- **useSpeech()** → `{afterSpeech(line), pause(ms)}`: promessas para encadear falas e ações sem cortar o Bonzi (`say(A); await afterSpeech(A); …`). `afterSpeech` espera o FIM REAL do áudio; sem voz, espera ~65 ms por letra. Nenhuma das duas resolve depois de a cena desmontar. Prefira isto a estimar a duração da fala com `{hold}`.
- **stepDuration**, **REDUCED_MOTION_MS = 0** e os tipos `SequenceStep`, `SequenceOptions`, `SequenceControls`, `Timers` e `TimerOptions`.

**Aleatoriedade**
- **useSeededRandom(attempt, {salt?, perSession=true})** → `SeededRandom {seed, float(key), int(min,max,key), pick(list,key), shuffle(list,key,avoidIdentity), chance(p,key)}`.
  - Cada valor é determinado só por (seed, key), sem depender da ordem das chamadas nem dos re-renders.
  - `perSession` adiciona um sal por carregamento de página (`crypto.getRandomValues`), então a variação muda também a cada visita. Com `false`, ela depende só de `attempt`.
  - **createSeededRandom(seed)** é a versão pura.
  - Padrão usado em `engines/missao-recuperar-a-conexao/index.tsx`: `session = useSeededRandom(0,{salt})` para sortear a ordem uma vez por visita, `rand = useSeededRandom(attempt,{salt})` para cada tentativa, e `order[attempt % order.length]`.

**Utilitários e tipos**
- Funções: `point`, `midpoint`, `lerpPoint`, `sceneDistance(a,b,ratio)` (em % da largura, corrigida pela proporção), `sceneAngle`, `pathLength` e `resolveSprite(element?,src?)` (cai em `SPRITES.placeholder`).
- `cssVars`, `round` e `cx` existem em `kit/util.ts`, mas **não** são exportados pelo `index`.
- Tipos: `DEFAULT_RATIO = 16/9`, `ScenePoint {x,y}`, `KitTone = "default"|"info"|"success"|"danger"|"warning"|"muted"`, `MarkStatus = "correct"|"wrong"|null|undefined` e `ElementKey`.

## 8. Regras de robustez embutidas

- **Lógica temporizada só com setTimeout,** via `useSequence`, `useTimers` e o próprio `Packet`. Nunca dependa de `animationend`, `transitionend` ou `requestAnimationFrame`. O rAF só aparece para limitar o pointermove durante o arraste (`OrderCards`, `DragProvider.moveDrag`), nunca para avançar a lição. Os timers são limpos no unmount.
- **Movimento reduzido:** `useReducedMotion()` (`hooks/useReducedMotion.ts`) combina `settings.reducedMotion` com `prefers-reduced-motion`.
  - Passos numéricos de `useSequence` e `useTimers` viram 0 ms, mas `{hold}` e `{hold:true}` são mantidos. Use hold para pausas de leitura e para dar tempo à fala do Bonzi (os motores usam cerca de 65 ms por caractere).
  - O CSS global (`app/globals.css`) zera animações e transições sob `@media (prefers-reduced-motion)` e sob `:root[data-reduced-motion="true"]`, que é definido por `useSettings`.
  - `Packet` salta direto e `Link` não anima os pontos.
- **Nunca use `Math.random` no render.** Use `useSeededRandom(attempt)`.
- **Acessibilidade:** as primitivas têm `aria-live` e anúncios `sr-only`, os sprites clicáveis viram `<button>`, os motores fazem o foco ir para o botão que chama atenção e `StageBanner` tem uma região viva estável.


## Armadilhas
- Os 8 motores de S3 e S4 (o-que-acontece-quando-acesso-um-site, html-os-blocos-de-uma-pagina, monte-sua-pagina, conserte-a-pagina, como-as-informacoes-viajam, http-e-https, detetive-digital, missao-navegacao-segura) existem como stubs em engines/<slug>/index.tsx, mas NÃO estão em ENGINES (engines/index.ts). Por isso abrem com o meta genérico PREVIEW_LESSON_META/PREVIEW_LAB_META (3 cenas/etapas), e não com o meta próprio do stub. Se um stub for registrado sem o motor real, o placeholder passa a contar progresso e libera o próximo planeta.
- Modo prévia é silencioso: motor ausente, import que falhou, módulo inválido (default não é componente ou meta.kind errado) ou kind trocado (lab registrado para uma aula) caem todos no placeholder com a etiqueta 'Prévia', sem tela de erro e sem gravar progresso (trackedId = null). Se um motor aparecer como 'Prévia', confira o registro, o export default/meta e o kind.
- No lab, o motor fica num div com display:none (.engineHost). Tudo que não estiver dentro de <Stage> ou <Interaction> fica invisível. No primeiro render os portais são null (os alvos chegam por setState), então efeitos de filhos dentro de Stage/Interaction só rodam um render depois.
- O motor de aula NÃO é remontado ao trocar de cena. Estado e timers de cenas anteriores continuam vivos se não houver um subcomponente por cena com key. O motor de lab É remontado a cada 'Jogar de novo' (EngineBoundary key={attempt}) e é desmontado quando o resultado aparece.
- Os shells envolvem o motor em memo (useMemo(() => memo(Engine), [Engine])). O motor não re-renderiza quando o shell muda (fala, dica, feedback, pontos); ele só re-renderiza pelas próprias props (scene, attempt, reducedMotion) ou pelo próprio estado. Não conte com re-render vindo do pai.
- setCanAdvance é zerado a cada troca de cena (goTo), e canNext também é true para cenas já visitadas (scene < visited) e quando a aula já foi concluída (allScenesOpen). 'Rever aula' não zera visited.
- A 'pausa antes de liberar' fica a cargo do motor (ex.: timers.after(READY_PAUSE_MS=1400, () => setCanAdvance(true), {hold:true})). Quando ready vira true, o SpriteButton com focusOnAttention puxa o foco e rola até o botão. Liberar cedo demais tira o foco da cena antes de o aluno ver o resultado.
- Pontuação do lab: 1.000 (conclusão) + até 4.000 (erros) + até 5.000 (tempo), ver labScore e config/labTiming.ts. 4 erros zeram a parte dos erros. Medalhas: ouro ≥ 90%, prata ≥ 70%, bronze abaixo disso. mistake() depois de finish() é ignorado, e finish() só vale uma vez por tentativa. 'Novo recorde!' só aparece quando já existia uma melhor pontuação anterior (previousBest !== null).
- Para marcar todas as etapas como feitas, chame setStep(meta.steps.length): o stepper usa 'index < step' e setStep não limita o valor por cima. Os motores atuais fazem isso antes de finish().
- No feedback do lab, o bloco usa key = tom:mensagem. Repetir exatamente a mesma mensagem não reanima. A moldura do guia só muda de cor em 'error' e 'success'.
- Unidade do kit: dentro do SceneCanvas, 1 = 1% da largura (1cqw). No painel Interaction (fora do canvas), o fallback é 8px. Place, Link e Packet usam fallback 1cqw e só funcionam dentro de um SceneCanvas. O size do ActionButton é em px, não em unidade do kit.
- StageBanner exige a prop reducedMotion. DragBoard não repassa onSelect: para trocar a dica ao selecionar uma peça, use DragProvider + DragPiece + DropZone. DragPiece e DropZone lançam erro fora de um provider.
- ChoiceGrid, OrderCards, AnswerInput e Packet guardam estado interno a partir das props iniciais. Para reiniciar ou repetir, troque a key (OrderCards só lê items na montagem).
- Timers: passos numéricos de useSequence/useTimers viram 0 ms com movimento reduzido, e só {hold} ou {hold:true} são mantidos. Pausas de leitura e espera pela fala do Bonzi precisam de hold, senão somem para quem usa movimento reduzido. Nunca use animationend/rAF para a lógica, nem Math.random no render (use useSeededRandom).
- useEngineModule guarda os módulos num Map no nível do módulo. Num HMR o loader roda de novo, mas o estado das cenas já montadas permanece. A chave do motor é content.engine/config.engine, com o slug do planeta como fallback. Hoje as duas coisas são iguais na API, mas a fonte de verdade é o campo engine do banco.
- O progresso é só local (localStorage 'rota404.progress' via hooks/useProgress.tsx). O ajuste unlockAll libera todos os planetas no computePlanetState. A tela fica em 'loading' até o progresso ser lido (progress.hydrated).
