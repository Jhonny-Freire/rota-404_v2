<!-- Referência detalhada gerada a partir da leitura do código em 17/10/2026. Se o código mudar, atualize este arquivo. -->
# Ficha técnica: MOTORES (aulas e laboratórios), Galáxia G1 "Internet e Web"

Todos os caminhos são relativos à raiz do projeto. Conferido no código atual (somente leitura). `npx tsc --noEmit` em `frontend/` passa sem erros. O `frontend/package.json` tem só os scripts `dev`, `build`, `start` e `typecheck`; não há lint nem testes no frontend.

## 1. Onde ficam as coisas
- Motores: `frontend/components/learning/engines/<chave>/`. O registro fica em `frontend/components/learning/engines/index.ts`.
- Contrato e runtime: `frontend/components/learning/runtime/`
  - `types.ts`: `LessonEngineProps/Meta` e `LabEngineProps/Meta`.
  - `useEngineModule.ts`, `LessonRuntime.tsx`, `LabRuntime.tsx`.
  - `placeholders.tsx`: `PlaceholderLessonEngine`, `PlaceholderLabEngine`, `PREVIEW_LESSON_META`, `PREVIEW_LAB_META`.
  - `planetContext.ts`: `loadPlanetContext`.
  - `EngineBoundary.tsx` e `portals.tsx` (`Stage` e `Interaction` via createPortal).
- Shells:
  - `frontend/components/learning/LessonShell.tsx`: controla as cenas e o "O que fazer".
  - `LabShell.tsx`: controla pontos, etapas, feedback e o "Jogar de novo".
  - `PlanetScreen.tsx`: corpo de `/aulas/[id]` e `/laboratorios/[id]`.
- Kit de cena: `frontend/components/learning/kit/` (barrel `index.ts`).
- Sprites:
  - `frontend/config/assets.ts` tem `ELEMENTS` (chaves do tipo `ElementKey`), `SPRITES` e `BACKGROUNDS.starfieldFar`.
  - Os arquivos ficam em `frontend/public/sprites/elements/*.png`.
  - Chaves disponíveis: box, boxGold, boxEmpty, cellphone, tablet, notebook, pc, monitor, setup, printer, server, serverError, router, wifi, cable, internet, cloudUpload, webpage, mail, photo, house, pin, magnifier, question, ok, error, lockClosed, lockOpen, key, gateClosed, gateOpen, door, hacker, robot, person, camera, microphone.
- Especificações: `G1 - Internet e Web/S<n> - .../aula<n>-<m>.md` e `lab<n>-<m>.md`. Na raiz, `prompt_base (1).md` traz a regra de UI: só sprites e imagens; nada de bibliotecas de ícones, emoji, SVG ou Unicode no lugar de sprite.

## 2. Como um motor é escolhido (fluxo real)
1. `PlanetScreen` chama `loadPlanetContext(kind, id, ?sistema)`, que consulta `GET /api/lessons/<ref>` ou `GET /api/labs/<ref>`.
   - O `ref` aceita o id do planeta (UUID) ou o slug; os dois foram testados.
   - Se a API responder 501 ou 404, usa o planeta do sistema.
2. `engineKey = content.engine` (aula) ou `config.engine` (lab). Na falta deles, vale o `planet.slug`.
3. `useEngineModule(engineKey)` → `getEngineLoader` → `import()` dinâmico.
   - Valida `mod.default` e `mod.meta.kind` ("lesson" ou "lab").
   - Guarda em cache por chave (Map `loaded`).
4. Chave ausente do registro → status "missing" → o shell roda em modo prévia com `PreviewLessonEngine` (3 cenas: Abertura, Exploração, Desafio) ou `PreviewLabEngine` (Observar, Testar, Concluir).
   - O `trackedId` fica null, então a prévia não entra no progresso nem libera o próximo planeta.
5. Bloqueio de planetas (`frontend/lib/progress.ts`, `computePlanetState`):
   - Funciona por sistema: o 1º planeta de cada sistema está sempre disponível; o planeta N exige o N-1 concluído.
   - `settings.unlockAll` libera tudo.
6. URL: `/aulas/<planetId>?sistema=<systemSlug>` e `/laboratorios/<planetId>?sistema=...` (`ROUTES.lesson/lab` e `planetHref`).

O banco já tem `engine` para os 16 planetas, nos dois seeds:
- `supabase/seed.sql`, nas linhas 50–57 (aulas) e 62–69 (labs).
- `backend/app/data/seed.json`, a reserva usada quando o Supabase falha. Ele precisa ser mantido em sincronia com o `seed.sql`.

Formato:
- Aula: `content = {"code":"1.1","engine":"<slug>","central_idea":"..."}`.
- Lab: `config = {"code":"1.3","type":"<tipo>","engine":"<slug>"}`, com `max_score = 100`.

## 3. Os 16 planetas do G1 (API `/api/galaxies/internet-e-web`)
A galáxia é `87bdb573-d9fa-44fb-b5f0-ff6deb5096dd` (slug `internet-e-web`, faixa `13-ou-menos`). Os sistemas e seus slugs:
- S1 `dispositivos-e-conexao` (id `8476d0aa-b1fd-44b3-8c18-0b2eba3db184`)
- S2 `enderecos-e-sites` (id `f8fb02b1-2fde-41e3-9906-af4bfadde841`)
- S3 `navegador-e-paginas-web` (id `e529d3ff-c674-4bfb-8aae-d85876868b5b`)
- S4 `comunicacao-e-seguranca` (id `3c9f5340-e271-46a4-8870-0bffaebc5743`)

Na tabela, chave do motor = slug = content.engine ou config.engine (os três coincidem em todos).

| Código | Nome | Tipo (config.type) | Chave do motor | Id do planeta | .md | Status |
|---|---|---|---|---|---|---|
| 1.1 | O que é uma rede? | lesson | o-que-e-uma-rede | 332fa3b7-b277-472a-a7c5-d1ddda87daee | S1/aula1-1.md | implementado e registrado |
| 1.2 | Como meu dispositivo chega à internet? | lesson | como-meu-dispositivo-chega-a-internet | a99ac3e4-ac58-4d29-a608-d79cb47bec23 | S1/aula1-2.md | implementado e registrado |
| 1.3 | Conectando uma rede | lab (montagem) | conectando-uma-rede | d8a76f7c-f8a8-4485-a562-a1f56f66eaa9 | S1/lab1-3.md | implementado e registrado |
| 1.4 | Missão: recuperar a conexão | lab (diagnostico) | missao-recuperar-a-conexao | be15cbee-f1e7-4e8a-8cdb-325e44765692 | S1/lab1-4.md | implementado e registrado |
| 2.1 | Todo dispositivo precisa de um endereço | lesson | todo-dispositivo-precisa-de-um-endereco | 1eb5b228-70c6-4ebc-8b1c-6d0d7bfa01da | S2/aula2-1.md | implementado e registrado |
| 2.2 | IP, domínio e site | lesson | ip-dominio-e-site | 39233cf4-36b9-4517-a9c8-b14bada25ac1 | S2/aula2-2.md | implementado e registrado |
| 2.3 | Encontrando o destino | lab (associacao) | encontrando-o-destino | 95af5ac6-f9eb-4bd2-84e9-3535f30a72f0 | S2/lab2-3.md | implementado e registrado |
| 2.4 | Missão: encontrar o servidor | lab (labirinto) | missao-encontrar-o-servidor | fff18e03-8baf-470d-b136-7c03075c4548 | S2/lab2-4.md | implementado e registrado |
| 3.1 | O que acontece quando acesso um site? | lesson | o-que-acontece-quando-acesso-um-site | 28178e76-38a1-445f-afb3-4e61ec61fbb9 | S3/aula3-1.md | stub, não registrado, abre em prévia |
| 3.2 | HTML: os blocos de uma página | lesson | html-os-blocos-de-uma-pagina | 69517683-7e23-432e-8b30-ce1198715810 | S3/aula3-2.md | stub, prévia |
| 3.3 | Monte sua página | lab (construtor) | monte-sua-pagina | 34d5ed89-e884-4f4e-921c-f6813d9eab21 | S3/lab3-3.md | stub, prévia |
| 3.4 | Conserte a página | lab (correcao) | conserte-a-pagina | dc2289ef-4b9b-424d-b351-f4115bd95639 | S3/lab3-4.md | stub, prévia |
| 4.1 | Como as informações viajam? | lesson | como-as-informacoes-viajam | 0bc02c66-205e-4351-87cd-e4129dcd98e1 | S4/aula4-1.md | stub, prévia |
| 4.2 | HTTP e HTTPS | lesson | http-e-https | c97af471-eb71-4239-8687-1a8288e2b8c5 | S4/aula4-2.md | stub, prévia |
| 4.3 | Detetive digital | lab (investigacao) | detetive-digital | 002ca2f6-5188-4a95-aa6a-4466e12a5f6a | S4/lab4-3.md | stub, prévia |
| 4.4 | Missão: navegação segura | lab (decisoes) | missao-navegacao-segura | 3a21810a-44f3-4ecd-ad77-a60bff685c83 | S4/lab4-4.md | stub, prévia |

As pastas dos .md:
- S1 = `G1 - Internet e Web/S1 - Dispositivos e conexão/`
- S2 = `.../S2 - Endereços e sites/`
- S3 = `.../S3 - Navegador e páginas Web/`, com aula3-1.md, aula3-2.md, lab3-3.md e lab3-4.md.
- S4 = `.../S4 - Comunicação e segurança/`, com aula4-1.md, aula4-2.md, lab4-3.md e lab4-4.md.

## 4. Contrato (runtime/types.ts)

### Aula
`export const meta: LessonEngineMeta = { kind: "lesson", scenes: string[], hints?: string[] }`, com `hints` no mesmo índice de `scenes`.

Props: `{ scene, say, setCanAdvance, next, setHint, reducedMotion }`.
- O shell zera `setCanAdvance(false)` e o hint a cada troca de cena.
- O motor NÃO é remontado ao trocar de cena. Por isso cada cena é um subcomponente com `key`; assim estado e timers reiniciam sozinhos.
- O motor só é remontado em "Rever aula" (`EngineBoundary key={run}`).
- Com o planeta já concluído (`allScenesOpen`), "Próxima cena" fica sempre liberada.
- Quando a cena libera o avanço, o shell troca o "O que fazer" por `Muito bem! Agora toque em "<Próxima cena|Concluir>"` e leva o foco ao botão.

### Laboratório
`export const meta: LabEngineMeta = { kind: "lab", steps: string[] }`.

Props: `{ attempt, maxScore, say, feedback, setStep, mistake, finish, reducedMotion, Stage, Interaction }`.
- Tudo precisa ser renderizado dentro de `<Stage>` (palco 16:9; ponha um `<SceneCanvas>` dentro) e/ou de `<Interaction>` (painel "Área de interação"). O que ficar fora não aparece.
- O motor é remontado a cada "Jogar de novo" (`EngineBoundary key={attempt}`, com attempt + 1).
- Pontos: `labPoints = max(ceil(50% de max), max − 10 × erros)`. Medalha: ouro ≥ 90%, prata ≥ 70%, bronze abaixo (`frontend/lib/progress.ts`).
- `feedback({tone: "success"|"error"|"info"|"hint", message})` preenche o painel Feedback.

### Regras comuns
- `say(msg, BonziState?)`: os estados são idle, speaking (padrão), happy, thinking, warning e help. Repetir a mesma frase fala de novo.
- Todas as funções recebidas têm identidade estável e são seguras em deps de useEffect.
- Os motores importam do runtime apenas TIPOS (`import type ... from "@/components/learning/runtime"`). Os stubs importam o placeholder direto de `runtime/placeholders`.

## 5. Kit (kit/index.ts). Usar sempre, em vez de reinventar
- Unidade: 1 = 1% da largura do `SceneCanvas` (variável CSS `--kit-u`, que vale 1cqw dentro do canvas). Coordenadas `x` e `y` em % de 0 a 100.
- Primitivas:
  - Cena e posição: `SceneCanvas` (`backdrop` = "none", "grid" ou "floor"; `label`), `Place` (`x`, `y`, `anchor`, `z`, `width`, `moveMs`, `hidden`).
  - Sprite: `SceneSprite` (`element|src`, `size`, `label`, `alt`, `highlighted`, `dimmed`, `selected`, `correct`, `wrong`, `pulse`, `onClick`, `pressed`, `disabled`).
  - Ligações: `Link` e `SceneLink` (`state` = "idle", "active", "broken" ou "off"; `dots`, `speedMs`, `thickness`, `breakMark`).
  - Pacote: `Packet` (`path`, `durationMs`, `delayMs`, `stopAt`, `blocked`, `loop`, `loopPauseMs`, `hideOnArrive`, `onArrive`, `onReach`). Funciona por timer, nunca por animationend.
  - Textos: `Tag`, `Callout`/`Balloon`, `StageBanner` (`text`, `tone`, `icon`, `reducedMotion`, `y=9`, `maxWidth=80`, `live`).
  - Botão: `ActionButton` (`label`, `element`/`sprite`, `variant`, `attention`, `focusOnAttention`).
  - Arrastar e soltar: `DragProvider`/`DragPiece`/`DropZone`/`POOL_ZONE`. `onMove(itemId, zoneId)`; retornar false recusa a peça. `onSelect` avisa a seleção.
  - Página: `BrowserFrame` (`url`, `secure`, `highlight`, `loading`, `tabTitle`, `actionLabel`/`onAction`) e `PagePreview`/`Block` (`BlockKind`: title, text, image, button, input, link; `BLOCK_TAGS` e `BLOCK_LABELS`). Feitos sob medida para o S3 e o S4.
  - Ainda não usados por nenhum motor: `ChoiceGrid`, `OrderCards`, `AnswerInput`, `DragBoard` (versão alta), `FlowChain` (só no 1.3 e no 2.4).
  - Tempo: `useSequence(steps, {onStep, onDone, reducedMotion, play})`. Um número é ANIMAÇÃO e vira 0 ms com movimento reduzido; `{hold: ms}` é pausa de LEITURA e fica. `useTimers()` dá `after(ms, fn, {hold})` e `clearAll`, tudo cancelado no unmount.
  - Aleatoriedade: `useSeededRandom(attempt, {salt, perSession})`, com `float/int/pick/shuffle(list, key, avoidIdentity)/chance`. Nunca `Math.random` no render.
  - Geometria: `lerpPoint`, `sceneDistance`, `pathLength`, `midpoint`.

## 6. Motores implementados

### 6.1 Aula 1.1 `o-que-e-uma-rede` (aula1-1.md)
**Arquivos:** `index.tsx` (meta + um `SceneCanvas` + `Starfield` + `{scene===i && <SceneX key .../>}`), `devices.ts` (DEVICES, NETWORK, SPOTS, `reachable`, `pairKey`, textos), `NetworkParts.tsx` (Starfield, Banner, Live, DeviceNode, NetLink, Wire), `SceneIntro`, `SceneFirstLink`, `SceneManyLinks`, `SceneExample`, `SceneQuiz`, `SceneClosing`, `OQueEUmaRede.module.css`.

**Cenas do meta:** Apresentação, Criando a conexão, Vários dispositivos, Exemplo concreto, Microteste, Encerramento (o .md põe o Encerramento como seção à parte; aqui ele virou a 6ª cena).
1. Tocar num aparelho envia uma mensagem (Packet `blocked`), que para no espaço e mostra um "?". Libera depois da 1ª parada mais 1,4 s.
2. Tocar em dois aparelhos cria a ligação. O par escolhido sobe para o índice via `onLinked`/`setFirstLink` e vira o estado inicial da cena 3: é estado do motor que atravessa cenas.
3. O aluno liga os aparelhos de fora até todos estarem na rede (`reachable`, BFS). Com a rede completa, o subcomponente `Traffic` (memo + forwardRef) faz cada aparelho iniciar a conversa por vez, mostrando que "não importa qual começa".
4. Passiva: a foto viaja Celular → Computador. Tocar no celular reenvia.
5. Microteste de escolha única. Só "dois aparelhos ligados" é correto; "um aparelho com uma conexão" (`dangling`) conta como ERRADO. O .md fala em "tocar nos exemplos" (plural); foi interpretado como uma resposta só. O erro não revela a resposta (o texto volta depois de 1,3 s).
6. Passiva: triângulo de 3 aparelhos e a fala "Uma rede são dispositivos conectados."

**Feedback:** usa os textos do .md ("Isso! Eles estão conectados." / "Ainda não. Procure uma conexão.").

### 6.2 Aula 1.2 `como-meu-dispositivo-chega-a-internet` (aula1-2.md)
**Arquivos:** `index.tsx` (array `SCENES: ComponentType<SceneProps>[]`, renderiza `<Scene key={index}/>`; cada cena tem o próprio `SceneCanvas`), `parts.ts` (PARTS phone, wifi, router, internet, site; WORLD, WORLD_PATH; `READY_PAUSE_MS = 1400`; `RETRY_MS = 1200`), `IntroScenes.tsx` (SceneProblem, SceneWifi, SceneRouter), `PathScenes.tsx` (SceneInternet, SceneExplore, SceneClosing), `ChallengeScene.tsx`, `World.tsx` (Waves, World, RouteStrip), CSS module.

**Cenas:** O problema, Wi-Fi, O roteador, Internet, Repetição interativa, Microdesafio, Encerramento.
1. `BrowserFrame` "site.com" com "Sem conexão".
2. Tocar no Wi-Fi mostra as ondas. Só o 1º toque agenda a liberação.
3. Pacotes em loop passam pelo roteador. O `RouterFlash` (forwardRef) evita re-renderizar a cena.
4. Nuvem Internet com o site dentro e a faixa Celular → Wi-Fi → Roteador → Internet → Site.
5. Tocar nas 5 partes: cada toque mostra o Callout com o papel da parte. Libera quando todas foram tocadas.
6. Uma seta some e o aluno escolhe a parte que falta.
   - A parte que falta é sorteada entre wifi, router e internet por `useSeededRandom(0, {salt: "aula-1-2-microdesafio"})`, então varia por visita.
   - As opções são a parte certa, outra parte do caminho e os intrusos Impressora e Câmera, embaralhados.
7. Encerramento: o pacote anda de parte em parte, com botão "Ver de novo" (remonta `ClosingRun` via key).

### 6.3 Lab 1.3 `conectando-uma-rede` (lab1-3.md)
**Arquivos:** `index.tsx` (1096 linhas; a máquina de estados toda está aqui, exceção ao padrão), `network.ts` (NODES pc, phone, wifi, router, internet com `rank`; VARIANTS; SLOTS em hexágono; `FORWARD` (ligações válidas); `evaluate`; `mainBlock`; CONCEPT_HINTS), `NetworkPanel.tsx` (LinkList, SuccessRoutes com FlowChain), CSS module.

**Etapas:** Arrastar, Ligar, Testar, Funcionou!

**Fluxo:**
- Arrastar as peças da bandeja (DragProvider/DropZone) para os espaços da área "Monte a rede". A posição não importa, só a relação lógica.
- Ligar tocando em duas peças ou arrastando de uma até a outra. A linha amarela de prévia é o `PreviewWire`.
- Cada ligação tem um X para apagar.
- Testar:
  - Peça solta: só um aviso ("Falta ligar: ..."), sem penalidade.
  - Rede toda ligada: `evaluate` leva um pacote de cada dispositivo até a internet e para no PRIMEIRO problema (`Fault` = node ou edge). Aparece o balão "Falta uma ligação aqui" ou "Essa ligação não leva à internet", posicionado por `calloutSpot` para não cobrir peças nem a faixa.
- Na 2ª falha no mesmo ponto vem a dica de conceito (`CONCEPT_HINTS`).
- No sucesso: "Conexão funcionando!", os pacotes em loop, depois `finish` após 2,6 s.

**Pontuação e variação:**
- `mistake()` só em teste reprovado.
- A variação gira a partir de um início sorteado na visita: `VARIANTS[(sessionRand.int(...)+attempt) % 3]`, com as variantes computador, celular e dois-dispositivos, as três do .md.
- A ordem da bandeja é `rand.shuffle(..., true)`.

**Interpretações próprias:**
- O PC pode ir por cabo ao roteador OU pelo Wi-Fi.
- O celular só vai pelo Wi-Fi.
- A peça colocada não volta para a bandeja (`handleMove` só aceita bandeja → área).

**Desempenho:** o ponteiro fica em `PreviewWire` (useImperativeHandle `move`) com rAF agrupando os pointermove. O retângulo do palco é medido uma vez por gesto (`rectRef`).

### 6.4 Lab 1.4 `missao-recuperar-a-conexao` (lab1-4.md)
**Arquivos:** `index.tsx` (estado), `model.ts` (FAULTS wifi, cable, router, target; `FAULT_PART`; TOOLS; TEXT; BANNER; TIMING; POS; FAILURE; STOP_CALLOUT; `flagsFor`), `NetworkScene.tsx` (palco), `ToolPanel.tsx` (botão "Ligar conexão" e ações), CSS module.

**Etapas:** Testar, Investigar, Consertar, Testar de novo.

**Phase:** start, testing, investigate, acting, ready, done.

**Fluxo:**
1. "Ligar conexão" faz o pacote parar no ponto da falha, com o balão "Parou aqui!".
2. Tocar nas 4 peças (computador, Wi-Fi, roteador, internet) dispara a animação curta e marca correct ou wrong.
3. As ações ficam TRANCADAS até o aluno achar a peça com falha. Depois aparecem as 4 ações embaralhadas: "Ligar o Wi-Fi", "Encaixar o cabo", "Trazer o roteador para casa", "Ligar o PC no Wi-Fi".
4. Novo teste.

**Mapeamento das falhas:** cada falha mora num componente diferente. O cabo pertence à "internet"; a falha "target" (o PC ligado na impressora) pertence ao "pc".

**Pontuação e variação:**
- `mistake()` NÃO é chamado ao escolher a ação errada; só no novo teste depois dela, no `afterStop` com `tool`.
- Ação já tentada fica bloqueada.
- Variação: `session.shuffle(FAULTS)[attempt % 4]`, então cada "Jogar de novo" usa a próxima falha da ordem sorteada na visita. O .md pede "falha em componente diferente".

**Textos:** os do .md ("Achou o problema!" / "Isso mudou a rede, mas a conexão ainda não funciona.").

### 6.5 Aula 2.1 `todo-dispositivo-precisa-de-um-endereco` (aula2-1.md)
**Arquivos:** `index.tsx` (um SceneCanvas + Starfield + cenas com key; `SCENE_LABELS` como label do canvas), `parts.tsx` (ART, `ip(last)` = `192.168.0.x`, DeviceNode, Letter, Hub, Live), `SceneWhich`, `SceneLabels`, `SceneCompare`, `SceneDestination`, `SceneQuiz`, `AddressForm.tsx`, CSS module (tem `.reduced`).

**Cenas:** Para qual deles?, Endereços, Comparação, Destino, Microteste. O .md não tem encerramento e não foi criado nenhum.
1. Dois PCs iguais piscando.
2. Etiquetas 192.168.0.10 e .20; a mensagem vai ao .20.
3. Casa "Rua Cometa, 42" ao lado do PC 192.168.0.20.
4. Notebook → hub → tablet 192.168.0.30, com fala da ideia central.
5. Três dispositivos (computer, tablet, cellphone) com IPs sorteados de `LAST_OCTETS` e o alvo de borda verde sorteado. Usa `useSeededRandom(0, {salt: "aula-2-1-microteste"})`, então muda por visita.
   - O aluno DIGITA o IP no campo "Para:" e toca em Enviar.
   - `normalizeIp` aceita zeros à esquerda e vírgula no lugar de ponto.
   - IP de outro aparelho: a mensagem vai até ele e volta.
   - IP inexistente: "Nenhum dispositivo tem esse endereço".
   - No acerto, o campo perde o foco (para fechar o teclado do tablet) e o avanço é liberado após 1,4 s.

**Cenas 1 a 4:** passivas, feitas com `useSequence`. Os comentários dimensionam os `{hold}` pela duração das falas.

### 6.6 Aula 2.2 `ip-dominio-e-site` (aula2-2.md)
**Arquivos:** `index.tsx`, `concepts.ts` (CONCEPTS ip `192.0.2.10`, domain `exemplo.com`, page `Página inicial`; LINES; SORT_*; `CARD_X`; `ROW_Y`), `parts.tsx` (Starfield, Banner, TONE), `CardScenes.tsx` (SceneCards, SceneIp, SceneDomain, ScenePage), `SceneChain.tsx`, `SceneSort.tsx`, CSS module.

**Cenas:** Três cartões, IP, Domínio, Página, Conexão entre os conceitos, Classificação.
- Cenas 1 a 5: passivas.
- Cena 4: `BrowserFrame` + `PagePreview`.
- Cena 5: animação exemplo.com → IP → servidor → página, com botão "Ver de novo" (`useSequence.restart`).
- Cena 6: arrastar ou tocar cartão → caixa (IP / Domínio / Página).
  - Caixa errada: a peça é recusada, a caixa fica vermelha e o Bonzi diz o que a CAIXA guarda (`SORT_HINTS`), sem entregar a resposta.
  - Os cartões do monte pulsam até serem colocados.

**Decisões registradas no código:**
- As falas da Cena 6 são extras, porque o .md não as define (comentário em `concepts.ts`).
- A fala do Domínio segue literalmente o .md ("um nome fácil de lembrar que serve como IP").

### 6.7 Lab 2.3 `encontrando-o-destino` (lab2-3.md)
**Arquivos:** `index.tsx`, `model.ts` (SERVERS A, B, C em 203.0.113.10/20/30; DOMAIN_POOL fotos, musica, cartas, videos, robos `.exemplo`; `ROUNDS = 3`; `buildMatch`; `testPath`; TEXT; BANNER; TIMING; `REPEAT_LINE_MS`), `MapScene.tsx` (palco: área do site + mapa), `DomainPanel.tsx` (lista lateral de domínios), CSS module.

**Etapas:** Receber, Tocar no domínio, Escolher, Conectar.

**Phase:** arriving, waiting, lookup, choose, testing, connected, done.

**Fluxo:** cada partida tem 3 rodadas (uma por servidor). Em cada uma:
1. O domínio chega.
2. Tocar no domínio (no palco ou no painel) dispara "Procurando o endereço...", que dura 1,1 s e mostra o IP.
3. O aluno toca no servidor.
4. O pacote viaja. Servidor errado: o pacote para em 36% da linha antes do X (`FAIL_STOP`), conta `mistake()` e o servidor fica marcado como tentado. Servidor certo: as linhas domínio → endereço → servidor ficam acesas e a próxima rodada chega sozinha.

**Final:** fala "O nome do site e o endereço usado na rede são coisas diferentes." (Objetivo didático do .md) e `finish` após 4,8 s.

**Variação (`buildMatch`):** permutações `PERMS` das colunas e dos donos avançam com o `attempt` a partir de um início sorteado na visita. Os domínios são sorteados por tentativa, e os servidores ganham um pequeno deslocamento horizontal.

**Foco:** só é movido quando o aluno usa o teclado (`keyboardRef` + `revealFocus` de `frontend/components/ui/revealFocus.ts`).

### 6.8 Lab 2.4 `missao-encontrar-o-servidor` (lab2-4.md)
**Arquivos:** `index.tsx`, `model.ts` (DESTINOS exemplo.com, jogos/fotos/musica `.exemplo.com`; DEVICES; OTHERS; `ROUTE_STEPS` wifi, router, internet com distratores; `buildMission`; `restPoint`; TEXT; BANNER; TIMING; `HELP_AFTER = 2`), `MapScene.tsx` (mapa em 5 colunas `COLS` × 3 linhas `ROWS`, cartão do destino, BrowserFrame + PagePreview no final), `MissionPanel.tsx` (botão "Receber destino" e lista das etapas possíveis), CSS module.

**Etapas:** Receber, Escolher, Chegar, Ver a página.

**Phase:** intro, choose, going, blocked, returning, responding, page.

**Fluxo:**
1. "Receber destino".
2. Em cada cruzamento, escolher a próxima etapa (Wi-Fi, depois Roteador, depois Internet) entre distratores sem saída: outros aparelhos da casa.
   - Caminho certo: fica iluminado e vira o novo ponto seguro.
   - Caminho errado: `mistake()`, o pacote treme e, após 1,3 s, volta ao último ponto seguro.
3. Ao chegar na Internet aparece o IP. O aluno escolhe o servidor pelo IP; servidor errado também volta ao ponto seguro.
4. O servidor responde e a página aparece; `finish` após 4,2 s.

**Ajuda do .md:** com 2 erros ou mais (`HELP_AFTER`), o Bonzi mostra a seta do próximo passo, falada uma vez só (`helpSaid`).

**Variação:**
- O destino e o IP do servidor certo avançam com o `attempt` a partir de um início sorteado na visita, então sempre mudam no "Jogar de novo".
- Aparelho de partida, distratores, fileiras e IPs vêm de `rand`, por tentativa.
- Cada camada é ordenada por y (`byRow`), para que a ordem do DOM e do Tab não entregue a resposta.

## 7. Padrões que se repetem (seguir nos novos motores)
- **Pasta:** `engines/<chave>/`. O `index.tsx` começa com `"use client"`, traz `export const meta` e `export default function <PascalCase>(props)`. Comentário-doc no default: `/** Aula X.Y — Título (G1 - Internet e Web/S.../arquivo.md) */`.
- **Arquivos auxiliares:**
  - Dados puros e textos: `devices.ts`, `parts.ts(x)`, `concepts.ts` ou `model.ts`.
  - Cenas: um arquivo `SceneX.tsx` por cena, ou agrupadas, como `IntroScenes.tsx`.
  - Labs: um componente de palco (`NetworkScene` / `MapScene`) e um de painel (`ToolPanel` / `DomainPanel` / `MissionPanel`).
- **`SceneProps` local:** `{ say, setCanAdvance, setHint, reducedMotion }`. O índice passa `const common = { say, setCanAdvance, setHint, reducedMotion }`.
- **Aula:** `{scene === i && <SceneX key="..." {...common} />}` dentro de um `<SceneCanvas className={styles.canvas}>` com `<Starfield/>` (padrão do 1.1, 2.1 e 2.2), ou um array de cenas com `key={index}` (1.2).
  - Fala inicial em `useEffect(() => say(...), [say])`.
  - Cena passiva: `useSequence([...], { onDone: () => setCanAdvance(true) })`, com o último passo `{hold}` cobrindo a fala (cerca de 65 ms por caractere).
  - Cena interativa: `setCanAdvance(true)` só depois do acerto, com pausa de 1400 ms em hold (`READY_PAUSE_MS`).
  - O erro nunca revela a resposta.
- **Lab:**
  - `type Phase` + `phaseRef` + wrapper `setPhase` (lê a fase atual dentro de timers).
  - `setStep(STEP.x)` por fase, com `const STEP = {...} as const` (índices de `meta.steps`); no fim, `setStep(meta.steps.length)` marca todas as etapas.
  - `mistake()` só para erro real do aluno; `finish` agendado com `timers.after(hold, finish, {hold: true})`.
- **Três canais de texto, sem repetir um no outro:**
  - Faixa `StageBanner`: o que fazer AGORA, de 22 a 36 caracteres. Estado `{spec, key}`; mudar a `key` faz o "pop" de novo.
  - Bonzi (`say`): a mesma ideia da faixa, uma vez por momento. `REPEAT_LINE_MS = 4000` evita recomeçar a mesma fala.
  - Painel Feedback ou "O que fazer" (`setHint`): o resultado ou o "como fazer".
  - Funções `guide(spec, line)` e `nudge(spec)`.
  - "Nenhum toque fica sem resposta": `remind()` responde aos toques fora de hora.
- **Variação por attempt:** `session = useSeededRandom(0, {salt: "<chave>:visita"})` + `rand = useSeededRandom(attempt, {salt})`. Índice `(session.int(...) + attempt) % N` para GARANTIR mudança a cada "Jogar de novo". Tudo em `useMemo` com `[rand, session, attempt]`. Aulas usam `useSeededRandom(0, {salt})`, que varia por visita.
- **Movimento reduzido:** passar `reducedMotion` para `useSequence`/`useTimers`, desligar loops e `Packet` decorativos, trocar animação por estado estático. Algumas CSS também usam `@media (prefers-reduced-motion)` e a classe `.reduced`. O global `:root[data-reduced-motion="true"]` fica em `frontend/app/globals.css`.
- **Acessibilidade:**
  - Região viva `<p className="sr-only" aria-live="polite">` (componente `Live`). Use `StageBanner live={false}` quando a cena já anuncia.
  - `alt` e `aria-label` descritivos; `data-*` para achar o foco (`data-net-node`, `data-server`, `data-choice`, `data-card`).
  - Foco com `revealFocus` ou `focusOnAttention` só quando faz sentido; "próximo passo" destacado com `pulse`/`attention`.
- **Desempenho:** nada de setState por pointermove no componente grande.
  - Isole o que muda muito num subcomponente com `forwardRef` + `useImperativeHandle` (PreviewWire no 1.3, Traffic no 1.1, RouterFlash no 1.2).
  - Agrupe com `requestAnimationFrame`. O DragBoard usa um hover store com `useSyncExternalStore`.
- **CSS module** (`<PascalCase>.module.css`):
  - `.canvas { --u: var(--kit-u, 1cqw); }` ou alias local (`--net-u`).
  - Medidas como `max(Npx, calc(k * var(--kit-u, 1cqw)))`.
  - `image-rendering: pixelated` nas imagens; animações com `steps(n)` (estilo pixel).
  - Os comentários citam conferência com o palco a 560 e 900 px.
- **Visual:** só sprites de `ELEMENTS` / `SPRITES`, mais formas em CSS (fios, blocos). Proibido ícone de biblioteca, emoji ou SVG no lugar de sprite.

## 8. Estado do S3/S4 (stubs)
As 8 pastas existem com um único `index.tsx` que exporta `meta` e um default que renderiza `PlaceholderLessonEngine` ou `PlaceholderLabEngine` com `meta` e `code`. O comentário diz `STUB X.Y — substituir pelo motor real (<caminho do .md>)`. As listas de cenas e etapas já espelham os .md:

| Planeta | Cenas / etapas no stub |
|---|---|
| 3.1 | Quero acessar um site, Fazendo o pedido, Conhecendo o servidor, Enviando a resposta, O site aparece!, Microinteração, Fechamento |
| 3.2 | Página pronta, Separação, HTML visual, Montagem, Microteste |
| 3.3 | Estrutura, Conteúdo, Elemento visual, Ação, Visualização |
| 3.4 | Observar, Tocar no erro, Corrigir, Testar |
| 4.1 | Entrando em uma conta, Enviando a requisição, O servidor recebe o pedido, O servidor responde, O resultado aparece, Microinteração, Fechamento |
| 4.2 | Enviando uma informação, Sem proteção, Protegendo a comunicação, HTTP e HTTPS, O cadeado, Encerramento |
| 4.3 | Analisar as evidências, Classificar, Descobrir os indícios, Revisar os casos |
| 4.4 | Senha, Permissão, Perfil público, Computador compartilhado, Pedir ajuda |

Como NÃO estão em `ENGINES`, a tela usa `PREVIEW_*_META`, e não o meta do stub.

## 9. Passo a passo para criar um motor novo (exemplo: 3.1)
1. Ler o .md inteiro (`G1 - Internet e Web/S3 - Navegador e páginas Web/aula3-1.md`). Listar as cenas ou etapas, as falas do Bonzi (entre aspas no .md), os textos de feedback, as variações e o que "não pode revelar".
2. Conferir a chave no banco (servidor já no ar): `curl -s http://127.0.0.1:5000/api/lessons/o-que-acontece-quando-acesso-um-site`. O `data.content.engine` precisa ser igual ao nome da pasta e à chave do registro. Para labs: `curl -s http://127.0.0.1:5000/api/labs/<slug>` → `data.config.engine`.
   - Se for preciso mudar, mude nos DOIS seeds: `supabase/seed.sql` e `backend/app/data/seed.json`.
   - Hoje as 8 chaves do S3/S4 já batem com as pastas.
3. Reescrever `frontend/components/learning/engines/<chave>/index.tsx`:
   - `"use client"`; `import type { LessonEngineMeta, LessonEngineProps } from "@/components/learning/runtime"`.
   - `export const meta = { kind: "lesson", scenes: [...], hints: [...] }`, partindo dos nomes do stub, com `hints` no imperativo, um por cena.
   - Default com o comentário-doc do .md.
   - `<SceneCanvas className={styles.canvas}>` + `{scene === i && <SceneX key=... {...common}/>}`.
   - Para lab: `LabEngineMeta {kind: "lab", steps}` e render em `<Stage><SceneCanvas>...</SceneCanvas></Stage>` e `<Interaction>...</Interaction>`.
4. Criar os auxiliares:
   - `parts.ts(x)` ou `model.ts`: SceneProps, posições, tamanhos nativos dos sprites, TEXT/BANNER/TIMING, funções puras de sorteio que recebem `SeededRandom`.
   - Um `SceneX.tsx` por cena.
   - Um CSS module com `--u` e pixelated.
   - Reaproveitar o kit: `BrowserFrame`, `PagePreview`/`Block`/`BLOCK_TAGS` para o S3; `ChoiceGrid`/`OrderCards`/`AnswerInput`/`DragProvider` para os testes; `Packet`/`Link` para o pedido e a resposta.
   - Sprite novo: arquivo PNG em `frontend/public/sprites/elements/` e chave em `ELEMENTS` (`frontend/config/assets.ts`).
5. Comportamento:
   - Cena passiva: `useSequence` com `onDone → setCanAdvance(true)`.
   - Microteste: libera só no acerto, com pausa hold de cerca de 1400 ms.
   - Erro: `say(msg, "warning")` + `setHint` sem a resposta.
   - Lab: `setStep` por fase, `mistake()` no erro, `finish` após hold, variação por `attempt`.
6. Registrar em `frontend/components/learning/engines/index.ts`, num bloco `/* S3 - Navegador e páginas Web */`, a linha `"o-que-acontece-quando-acesso-um-site": () => import("./o-que-acontece-quando-acesso-um-site"),` e atualizar o comentário "Liberados: ...". Registre só quando o motor for real: um stub registrado já entra no progresso e libera o próximo planeta.
7. Verificar:
   - `cd frontend` e `npm run typecheck`.
   - Abrir `/aulas/28178e76-38a1-445f-afb3-4e61ec61fbb9?sistema=navegador-e-paginas-web`. A etiqueta "Prévia" deve sumir e as cenas e hints devem ser os do meta.
   - Testar com movimento reduzido, teclado, tablet e celular (palco de cerca de 560 px), "Rever aula" e "Jogar de novo".
   - Para abrir 3.2 a 3.4 antes de concluir o 3.1, use o ajuste `unlockAll` (Configurações).

## Armadilhas
- Chave do motor = `content.engine` (aula) / `config.engine` (lab) = slug do planeta = nome da pasta = chave em `engines/index.ts`. Se a chave não estiver no registro, o planeta abre SILENCIOSAMENTE em modo prévia (sem erro), com `PREVIEW_LESSON_META`/`PREVIEW_LAB_META`. O meta do próprio stub não aparece enquanto ele não está registrado.
- Não registre um stub (`PlaceholderLessonEngine`/`PlaceholderLabEngine`) em `ENGINES`: registrado, ele vira um motor "real" (`trackedId` definido), conta como concluído no progresso e libera o próximo planeta.
- Os seeds são duplicados: `supabase/seed.sql` E `backend/app/data/seed.json` (reserva usada quando o Supabase cai). Mudar `engine`/conteúdo num sem o outro gera divergência (e quebra os testes). Hoje as 16 chaves batem com as pastas.
- O motor de AULA não é remontado ao trocar de cena (só em "Rever aula"): cada cena precisa ser um subcomponente com `key` para reiniciar estado e timers. Estado que atravessa cenas (ex.: `firstLink` na 1.1) mora no `index.tsx` do motor. O motor de LAB é remontado a cada "Jogar de novo" (`key={attempt}`).
- Labs: tudo que estiver fora de `<Stage>` ou `<Interaction>` (portais) não aparece. Coloque um `<SceneCanvas>` dentro de `<Stage>`.
- Motores importam só TIPOS de `@/components/learning/runtime` (`import type`). Importar valores do barrel do runtime cria ciclo runtime → useEngineModule → engines → runtime. Os stubs importam o placeholder direto de `runtime/placeholders`.
- `useSequence`: passo numérico é animação e vira 0 ms com movimento reduzido; pausas de leitura/fala precisam ser `{hold: ms}`, senão "Próxima cena" libera antes de o Bonzi terminar de falar (~65 ms por caractere).
- Nunca `Math.random` no render: use `useSeededRandom(attempt, {salt})`. Para GARANTIR variação diferente a cada "Jogar de novo": `session = useSeededRandom(0, {salt})` + índice `(session.int(...) + attempt) % N` (padrão do 1.3, 1.4, 2.3 e 2.4). Aulas usam `useSeededRandom(0, ...)` e variam por visita (`perSession` é true por padrão).
- `mistake()` custa 10 pontos (mínimo 50% de `max_score`). Vários motores NÃO penalizam de propósito: "Testar" com peça solta no 1.3 (só um lembrete); ação errada no 1.4 só conta no novo teste depois dela; respostas erradas em aulas nunca contam.
- Não faça `setState` a cada pointermove no componente grande: isole num subcomponente com `forwardRef` + `useImperativeHandle` e agrupe com `requestAnimationFrame` (PreviewWire no 1.3). O DragBoard já usa um hover store com `useSyncExternalStore`.
- Regra de UI do `prompt_base (1).md`: só sprites/imagens (`ELEMENTS`/`SPRITES` em `frontend/config/assets.ts`, arquivos em `frontend/public/sprites/elements`). Proibido ícone de biblioteca, emoji, Unicode ou SVG no lugar de sprite; formas simples em CSS (fios, blocos do PagePreview) são permitidas.
- O bloqueio é por sistema: o planeta N exige o N-1 concluído (`computePlanetState`). Como S3/S4 são prévias e prévias nunca concluem, para testar 3.2+ antes de o 3.1 existir use `settings.unlockAll` (Configurações → "Liberar todos os planetas").
- Interpretações das especificações a conhecer: no microteste da 1.1 só "dois aparelhos ligados" é certo (o .md diz "exemplos" no plural; a conexão solta conta como errada — decisão pendente com a equipe); no 1.3 o PC pode ir ao roteador por cabo OU pelo Wi-Fi e peças colocadas não voltam para a bandeja; no 1.4 as ações ficam travadas até achar a peça com falha; a 2.1 não tem cena de encerramento (o .md não tem); as falas do Bonzi na cena 6 da 2.2 foram criadas (o .md não define).
- Componentes do kit ainda não usados por nenhum motor e prontos para S3/S4: `ChoiceGrid`, `OrderCards`, `AnswerInput`, `DragBoard` (alto nível), `PagePreview`/`Block`/`BLOCK_TAGS`, `BrowserFrame` (`secure`/`highlight="protocol"` para a 4.2).
- Windows: caminhos com espaços e acentos (OneDrive …/Área de Trabalho) — use aspas nos comandos; `frontend/.next` tem muitos chunks que poluem o grep, então exclua `.next` e `node_modules`.
