# Histórico do desenvolvimento e decisões (Rota 404 V2)

Este arquivo resume as sessões de desenvolvimento feitas com o Claude Code (out/2026), as decisões tomadas pelo
usuário e o porquê de cada escolha. Leia antes de mudar algo que pareça "estranho": quase sempre há um motivo aqui.

## Linha do tempo

### Sessão 1 — Base do sistema (09–10/10/2026)
Pedido: implementar a BASE estrutural descrita em `prompt_base (1).md` (contexto em `resumo (1).md` e `planetas (1).md`),
SEM aulas/laboratórios. Entregue:
- Frontend Next.js 16 (App Router, TypeScript, CSS Modules, todas as páginas `"use client"`), backend Flask com
  Controller → Service → Repository → DataSource, Supabase como banco + modo local (`backend/app/data/seed.json`).
- 11 páginas + 404 temática, HUD, breadcrumbs, Bonzi Buddy (6 estados), avatar, foguete, mapas, progresso, pontuação,
  conquistas e ranking (estes três últimos só como estrutura/"em breve").
- Regra de UI: só sprites/PNG via `frontend/config/assets.ts` (nada de lib de ícones, emoji, Unicode-ícone ou SVG-sprite).
  Sprites que faltavam foram desenhados como placeholders pixel art (gerados por script Python fora do projeto).
- Ajustes após inspeção visual: o balão do Bonzi recolhe sozinho ~8 s depois da fala (cobria conteúdo); a fonte
  "Press Start 2P" deforma MAIÚSCULAS acentuadas (Á, Ç, Ã) → nunca usar `text-transform: uppercase` com a fonte display;
  galáxias ordenadas pela idade mínima da faixa (Internet e Web antes de API REST).
- Os arquivos originais `404_status_ok.png` / `404_status_erro.png` vieram com nomes trocados (o "ok" era o X vermelho);
  isso foi corrigido na cópia em `frontend/public`.

### Conexão com o Supabase real (13/10/2026)
- O projeto Supabase da equipe JÁ existia, criado por outro script, com schema diferente do nosso: planetas usam
  coluna `kind` (não `type`), slugs das faixas são `13-ou-menos` / `14-ou-mais`, já havia 16 planetas, 8 aulas e 8 labs
  com `content.engine` / `config.engine`, além de `users`, `user_progress` etc.
- Decisão: NÃO alterar o banco. O código se adaptou (Planet.from_row mapeia `kind` → `type`; sprites `planet-<nome>`).
  Depois, a migration e o seed do repositório foram reescritos a partir da introspecção do banco real, então hoje
  `supabase/` reproduz a produção (para um projeto NOVO). Não é preciso rodar nada no projeto atual.
- Lentidão inicial: cada consulta ao Supabase leva 0,25–1,4 s (região/rede) → origem do "lag" ao abrir telas.

### Fase 2 — Aulas e laboratórios (13/10/2026)
O usuário trouxe novas pixel arts (`assets/`, resolução nativa) e as especificações dos 16 planetas do G1
(`G1 - Internet e Web/S*/*.md`). Decisões do usuário (perguntadas explicitamente):
1. Implementar as cenas seguindo FIELMENTE os .md (falas do Bonzi literais) — depois o escopo foi reduzido para
   "só o S1 por enquanto", e o S2 veio numa rodada seguinte.
2. Narração: voz do navegador (`speechSynthesis`, pt-BR), respeitando Ajustes → Narração e volume.
3. Progresso e pontuação: salvos NO NAVEGADOR (`localStorage`), sem login. Supabase só para ler o catálogo.
Entregue: endpoints `/api/lessons` e `/api/labs`, cache do catálogo no Flask, snapshot local idêntico à produção,
runtime de aulas/labs + kit de cena + progresso + voz, sprites novos (nativos, ampliados por CSS pixelated) e
elementos que faltavam desenhados no mesmo estilo (roteador, wifi, cabo, tablet, casa, página, foto, chave, pessoa,
câmera, microfone). Opção "Liberar todos os planetas (modo apresentação)" em Ajustes.

### S1 publicado (13–14/10/2026)
- Bug: requisições simultâneas davam 503 (`WinError 10035`) porque o cliente padrão do postgrest usa HTTP/2 numa
  conexão única compartilhada entre threads → `backend/app/config/supabase.py` injeta um `httpx.Client(http2=False)`.
- Registro de motores restrito ao S1 (demais planetas abrem em "Prévia"); prévias NÃO contam progresso.
- Página do sistema: rótulos de planetas sobrepostos corrigidos (órbita maior, rótulos mais largos).
- QA dos 4 planetas do S1 no navegador.

### Rodada do colega (14–16/10/2026) — zip `ROTA_404_V2`
O colega refinou a UX (provavelmente com IA também). Mudanças que viraram CONVENÇÃO:
- Aulas: `meta.hints[cena]` + `setHint(texto|null)` → cartão "O que fazer" ao lado do botão de avançar.
- `SpriteButton`/`ActionButton`: props `attention` (anel pulsando no próximo passo) e `focusOnAttention`
  (foco vai para o botão quando ele vira o próximo passo); `ui/revealFocus.ts` rola só o necessário.
- `SceneStage ready`: cantos do palco piscam quando a cena libera o avanço.
- `kit/StageBanner`: faixa de instrução no alto do palco ("o que fazer AGORA").
- Narrator novo (retrato do Bonzi nos labs), página do sistema com HUD de coleção ("x/y concluídos", "Sistema completo!").
- Backend: `from __future__ import annotations` em `data_source.py` — OBRIGATÓRIO no Python 3.12 do colega
  (sem ele, `-> list[Row]` depois de `def list` quebra no import).

### S2 + desempenho (16–17/10/2026)
O usuário pediu o S2 e "deixar sem lag e sem travar". Como o projeto não usa git, o diff contra a versão anterior foi
feito recuperando (cópia, sem restaurar) a pasta antiga da Lixeira do Windows. Resultado:
- Diagnóstico medido simulando notebook fraco de feira (Edge headless, renderização por software, CPU 4x):
  telas caíam para 33–40 FPS. Causas: fundo de estrelas com 2 camadas gigantes deslizando por frações de pixel (maior
  causa), animações `background-position` ("trilhas marchando"), digitação do Bonzi com setState a cada 24 ms, motor
  re-renderizando a cada fala, arrasto com setState por pointermove, cache frio do backend (1,9–2,8 s em "Carregando").
- Correções: fundo em `steps()` (pixels inteiros, mesmo visual), trilhas por `transform`, `useTypewriter` (escreve no
  DOM), `AnimatedSprite` sem setState, `<Engine>` memoizado nos shells, DragBoard por ref + rAF, `backdrop-filter`
  removido, StatusView sem animar `width`. Resultado: 55–60 FPS no mesmo cenário fraco.
- Backend: pré-aquecimento do catálogo no boot (`app/warmup.py`), anti-manada por chave, servir valor vencido
  enquanto revalida, fallback para `seed.json` se o Supabase cair (circuit breaker de 30 s), TTL padrão 3600 s,
  `HOST` configurável (0.0.0.0 para rede da feira), timeouts menores, `FLASK_DEBUG=0` no `.env`.
- S2 implementado e registrado: 2.1 (o CSS module não existia — criado), 2.2, 2.3, 2.4 (variações sem repetir destino).
  QA jogou os 4 planetas; integração corrigiu `kit/Tag.module.css` (ícone espremia o texto; afeta S1 também).

### S3 — Navegador e páginas Web (19–20/10/2026)
O usuário pediu os 4 planetas do S3, em ordem, "seguindo o padrão já estabelecido" (as especificações enviadas eram
idênticas às de `G1 - Internet e Web/S3 .../`). O 3.1 foi feito por um fluxo com vários agentes (implementar, 3
revisões, correção, teste no navegador). O custo foi alto: ~1,5 milhão de tokens e o limite da sessão estourado.
As revisões de código acharam pouco (4 itens leves); o teste no navegador foi o que achou problemas reais. **Decisão
do usuário:** seguir sem multiagente, com Opus em esforço "high", implementando e testando direto na sessão. 3.2,
3.3 e 3.4 foram feitos assim. Detalhes de cada motor em `motores-g1.md` §6.9 a §6.12.
- **3.1:** correções do teste: legendas Internet/Resposta/Servidor sobrepostas no celular (a Resposta desceu abaixo do
  fio), etiqueta "Resposta" sob o painel de arquivos (z-index), avanço liberado antes do fim da fala do acerto.
- **Kit (`OrderCards`):** depois de um "Verificar" errado o botão fica desativado e o foco caía no body; agora vai
  para o cartão marcado. A mudança é retrocompatível e vale para todos.
- **3.2:** a Montagem (Cena 4) foi lida como PASSIVA (voz passiva no .md; o aluno só age no Microteste). Na
  Separação os blocos caem fora de ordem numa bandeja, para a Montagem ter "ordem correta" a mostrar. Só a fala da
  Cena 2 é do .md; as outras foram criadas e marcadas no código. Bug achado no teste e corrigido: a fala literal da
  Cena 2 saía no último passo e o avanço liberava junto.
- **3.3:** as três colunas do .md ficam no palco (Blocos, Área de edição, Prévia); a "Área de interação" tem as
  pequenas escolhas visuais (imagem e cor da página) e "Ver página". Bloco errado custa ponto uma vez por par
  (pedido, bloco). O código HTML aparece só depois de "Ver página", como recompensa.
- **3.4:** 5 páginas quebradas com 2 problemas cada. O "remove" do Fluxo virou o problema "bloco repetido", que não
  está entre os exemplos do .md. Tocar num bloco certo não tira ponto. Testar no meio do conserto dá "Quase!" sem
  penalidade. Erro conta quando o teste mostra o mesmo problema sem o aluno ter mexido no bloco marcado, ou quando
  surge um problema novo.
- **Teste:** os 4 planetas foram jogados no navegador interno em 1440x900, tablet e 375 px (sobreposição e corte
  medidos pelo DOM), com erro e depois acerto, conclusão, progresso, "Próximo planeta" e "Jogar de novo"
  (variação muda). Também com "Reduzir animações" (tempos conferidos) e sem erros no console. O 3.4 foi resolvido
  nas 5 variações por um solucionador automático, com 100 pontos. `npm run typecheck`, `npm run build` e os 110
  testes do backend passam.
- **Ambiente desta máquina:** só há Python 3.11, e o backend roda e passa nos testes nele. Foi criado
  `.claude/launch.json`, que sobe backend e frontend pelo painel de prévia do Claude Code.
- **Ajuste de layout dos labs no celular:** a faixa do palco (StageBanner) quebra em 2 linhas no celular. Nos labs
  do S3, a faixa fica em y=10.5 e as colunas descem 8 px abaixo de 480 px.

### S4 — Comunicação e segurança (20/10/2026)
Mesmo processo do S3 (sem multiagente; Opus em esforço "high"; implementar, typecheck, testar no navegador interno
em 1440x900, tablet e 375 px medindo sobreposições pelo DOM). As especificações enviadas eram idênticas às do projeto.
Com isso a **Galáxia 1 está completa** (16 planetas). Detalhes em `motores-g1.md` §6.13 a §6.16.
- **4.1:** "Em outra tentativa, a resposta pode indicar que os dados estão incorretos" virou o botão "Ver outra
  tentativa" na Cena 5 (mostra "Usuário ou senha incorretos."). REQUISIÇÃO/RESPOSTA em caixa alta na fonte do corpo
  (a display deforma Ç/Ã maiúsculos). Depois do acerto da ordenação, a comunicação completa é reproduzida (o .md
  pede) e só então libera o avanço.
- **4.2:** o aluno digita um apelido INVENTADO (rótulo e placeholder deixam isso claro; o valor fica só na memória da
  página) e é ESSE texto que o hacker lê no HTTP e não consegue ler no HTTPS. As duas falas seguidas do .md
  ("Essa não!..." e "Vamos mudar...") são ditas em sequência. As legendas da Cena 5 foram criadas a partir da fala.
- **4.3:** 8 casos (os 6 exemplos do .md, o da localização da Etapa 3 e um criado, "amigo com número novo");
  5 por partida (2 suspeitos, 2 seguros, 1 precisa verificar). Classificação errada tira ponto e NÃO revela a
  resposta: o caso vai para a revisão (Etapa 4), que marca a pista-chave. Painel final como o .md pede.
- **4.4:** resultados de cada opção ("o que acontece") criados. Depois do acerto o aluno pode tocar nas outras opções
  para ver o resultado sem perder pontos ("observar resultados diferentes"). O resumo junta "decisões a rever" e
  "dicas" por cenário.
- **Armadilha corrigida:** em 4.1/4.2 a classe de animação de entrada estava no mesmo elemento da escala do
  celular e anulava a escala (registrado em `motores-g1.md` §8).
- Verificação: typecheck, `npm run build` e 110 testes do backend passam; console sem erros numa carga limpa.

### Viagem da nave nos mapas (20/10/2026)
O usuário achou a navegação "dura" (a nave parada e o clique abrindo a página na hora). Uma 1ª versão (voo reto até
o destino e abrir) ficou "esquisitíssima"; a pedido dele, foi PORTADA a movimentação do Rota 404 antigo
(`OneDrive .../backup/ROTA_404/frontend/components/space/RouteMap.js` e `components/flight/FlightProvider.js`):
- `components/space/useRouteTravel.tsx` (usado por `SpaceMap`: mapa de galáxias e de sistemas; e pela página do
  sistema): a nave fica ESTACIONADA numa vaga à esquerda do destino, inclinada, e lembra onde parou por mapa
  (`localStorage` `rota404.parked`). Tocar num destino: a nave anda pelo traçado, passando pelos destinos do meio
  (vira em cada curva, Web Animations, 700–3200 ms pela distância), estaciona e o Bonzi pergunta "Quer entrar?" [23/10/2026: só no mapa da galáxia (`confirm`); nos outros mapas o toque já entra]
  (ou "Você já passou por aqui. Quer revisitar?"), com voz, num cartão no pé da tela (Entrar / Agora não; Esc fecha).
- `components/space/FlightProvider.tsx` (montado em `app/providers.tsx`): "Entrar" faz a nave planar até a órbita do
  destino, dar meia volta por cima dele fechando até o centro (pouso), o destino aproxima e a página troca em
  hiperespaço; na tela nova a nave da vaga desce do alto (`body[data-flying]`/`[data-arriving]` em `globals.css`).
- Página do sistema: o foguete que girava no anel do centro saiu; a nave agora estaciona ao lado dos planetas e anda
  pela órbita. Destinos trancados não têm vaga e seguem mostrando o aviso de antes.
- Diferenças do antigo, por desempenho: nave em voo SEM `drop-shadow`; chama por DOM (`AnimatedSprite`, sem
  setState por quadro); sem rastro de faíscas. Com "Reduzir animações" a nave muda de vaga sem voar e "Entrar" abre
  direto. Em telas ≤ 599 px a vaga fica mais perto do destino (`--dock-k`), sem rolagem lateral.
- Testado em 1440x900 e 375 px: viagem pelo traçado (galáxia e órbita do sistema), cartão do Bonzi, pouso,
  hiperespaço e troca de página.
- Correção: no pouso a nave aparecia duplicada (a da vaga + a que voa). A vaga era escondida com `visibility`, mas os
  quadros da chama do `AnimatedSprite` ligam `visibility: visible` nos filhos; agora é `opacity: 0` (`globals.css`).

### Rodada de feedback UI/UX S3 e S4 (20/10/2026) — relatório da Yasmin
Relatório `relatorio_de_feedback_e_ajustes_ui_ux_s_is_3_e_4.md` (fora do projeto). O que foi feito, item a item:
- **CRÍTICO, o Bonzi cortava a fala:** a voz agora tem estado REAL (`narrationService`: `isSpeaking`/`subscribeSpeaking`/
  `whenIdle`, com vigia para navegador que não dispara `end`). O LessonShell só libera "Próxima cena" quando a fala
  acaba ("Escute o Bonzi até o fim.") e o `next()` do motor espera a fala. O LabShell mostra o resultado só depois
  da fala. `say(msg, estado, {afterCurrent:true})` põe uma fala na fila. Novo `useSpeech` no kit para encadear
  falas pelo fim do áudio. Contrato atualizado em `runtime-shells-e-kit.md`.
- **Geral:** botão "Repetir" fala no balão do Bonzi e no retrato dos labs; na conclusão a ação principal ("Próximo
  planeta") fica no canto inferior direito; "Ver de novo" (cena 7 da 3.1 e da 4.1) logo abaixo da cadeia, no alto.
- **3.1 cena 6 e 4.1 cena 6:** sem avanço automático; botão "Continuar" depois das 4 partes e do fim da fala.
- **4.1 cena 1:** tocar em "Entrar" já leva à cena 2.
- **4.2:** cenas 1 e 2 juntas ("Enviando uma informação" com o HTTP); agora são 5 cenas. Falas encadeadas pelo fim do
  áudio na cena 1 e no HTTPS (testado: nenhuma fala começa antes da anterior terminar).
- **4.3:** o Bonzi narra todas as pistas; layout da investigação com mais respiro.
- **3.4:** mecânica simplificada: botões no próprio bloco da Estrutura, sempre liberados (no celular, botões grandes
  na área de interação para o bloco tocado). Detalhes em `motores-g1.md` §6.12.
- **Não feito (só recomendação no relatório):** "mais variedade" na 4.1.
- Testado no navegador interno (1440x900; 3.4 também em 375 px): 3.4 completa (Colocar, Subir, Testar, conclusão,
  Jogar de novo), 4.2 cenas 1–2 com log das falas, 4.1 Entrar, 3.1 cena 6, 4.3 narração. Typecheck, `npm run build`
  e 110 testes do backend passam. NÃO testado: tablet real, "Reduzir animações" nesta rodada.

### Contas, login e ranking (22/10/2026)
Pedido: "login -> apelido senha e idade (a idade é importante)" e ranking. Decisões do usuário: contas e pontos no
**Supabase**; login **obrigatório**; a idade **define a faixa sozinha** (a tela de escolher faixa virou só "seu universo").
- **Banco:** `supabase/migrations/20261022000000_accounts.sql` (idempotente) acrescenta em `users`: nickname,
  nickname_key (único, minúsculas), password_hash, age (check 4–120); índices únicos (user_id, entity_type, entity_id)
  em user_progress e (user_id, lab_id) em scores. **Precisa ser rodada no SQL Editor do Supabase** (não há acesso
  DDL pelo backend). Sem ela, cadastro/login respondem 503 e o log do Flask diz qual arquivo rodar.
- **Backend:** POST /users (cadastro → {token, user}), POST /sessions (login), DELETE /sessions/me, GET/PATCH /users/me
  (avatar_key, age), GET /progress e PUT /progress/<planet_id> {status, points?} (lab concluído grava a MELHOR
  pontuação em scores), GET /rankings/galaxies|systems/<ref> (público; com token traz `me`). Senha com PBKDF2-SHA256
  (biblioteca padrão, sem dependência nova); sessão = token aleatório, o banco guarda só o SHA-256 (`token_hash`).
  Um token por conta: entrar em outro aparelho encerra a sessão anterior. 5 senhas erradas seguidas bloqueiam o apelido
  por 30 s (memória). Filtro simples de palavrões no apelido (ranking público). `DataSource` ganhou insert/update
  (Local grava em memória; Supabase mapeia 23505 → 409). /scores e conquistas seguem 501. 21 testes novos
  (`tests/test_accounts.py`); 131 no total.
- **Frontend:** `hooks/useSession.tsx` (SessionProvider, `rota404.session`), `components/auth/SessionGate.tsx` (sem
  sessão, tudo menos "/" e "/entrar" vai para `/entrar?voltar=...`), página `/entrar` (criar conta / já tenho conta;
  Enter envia; idade e personagem no cadastro). O explorador (nome, personagem, faixa do HUD e do mapa) espelha a conta.
  `useProgress` sincroniza com o servidor e guarda o `owner`: outra conta no mesmo tablet começa do zero; o que foi
  feito sem rede é reenviado no próximo carregamento. Perfil: idade, faixa, troca de personagem salva na conta, "Sair da
  conta". Ranking abre na galáxia da faixa do aluno e destaca a linha dele ("Você está em Nº lugar").
- **Visitante:** se o cadastro/login falhar por servidor fora do ar (rede, 5xx), `/entrar` oferece "Jogar sem conta"
  (pede a idade; progresso só no aparelho, sem ranking).
- Testado no navegador interno (front da sessão G2 na 3011 + backend DATA_SOURCE=local na 5011): cadastro (idade 15 →
  só API REST), Enter, volta para a página pedida, senha errada, troca de conta no mesmo aparelho, progresso vindo do
  servidor, ranking com 2 contas, personagem salvo, sair, visitante (503 simulado), 375 px.
  Typecheck ok. `npm run build` NÃO rodou nesta rodada (outra sessão estava com `next dev` na mesma pasta e o Next
  16.4.0 interrompeu o build com um aviso de vulnerabilidade de segurança — ver pendências).

### Pontuação nova dos laboratórios (22/10/2026)
Pedido da equipe ("calculo da pontuacao.txt"): cada laboratório vale 10.000 = 1.000 por concluir + até 4.000 pelos erros
(−1.000 por erro) + até 5.000 pelo tempo; 80.000 por galáxia (8 labs).
- `labScore` em `frontend/lib/progress.ts` substituiu `labPoints`. Tempo: `min` (até aqui não desconta) e `avg`
  (tempo médio) por lab em `frontend/config/labTiming.ts` — valores INICIAIS estimados (90/240 s; 120/300 s no 4.3),
  a calibrar com o "Tempo" que o resultado mostra. Os labs G2 usam o padrão até a outra sessão preencher.
- **Interpretação registrada:** no texto, a 2ª metade do bônus de tempo usava `IIF(seg < min, 0, seg − med)`; entre min e
  med isso dava MAIS de 2.500 (total acima de 10.000). Implementado: a 2ª metade só desconta depois de med (cai até
  zero em 2 × med) e cada metade fica entre 0 e 2.500. CONFIRMADO pela equipe em 22/10/2026.
- LabShell: cronômetro por tentativa (só com a aba visível; para no `finish()`, a espera pela última fala não conta), HUD
  Pontos (previsto, ao vivo) / Tempo / Erros, resultado com a conta (Conclusão, Erros, Tempo).
- Catálogo: `max_score` 100 → 10000 nos 16 labs (seed.json, seed.sql, Supabase e testes). O backend limita os pontos a
  `max_score`. Pontuações antigas (escala 100) que existirem nas contas ficam pequenas no ranking: nenhuma conta real
  tinha pontos ainda.

### Galáxia 2 "API REST" — os 16 planetas (22/10/2026)
Pedido: implementar `faixa14-completa.md` (guardado em `random/G2 - API REST/`) "como estávamos fazendo antes".
Feito em paralelo com outra sessão (contas/login e pontuação nova): cada uma mexeu só nos próprios arquivos.
- **Catálogo:** 16 planetas, 8 aulas e 8 labs nos 4 sistemas da G2 (UUIDs novos), em `seed.json`, `seed.sql` e no
  **Supabase** (inseridos pelo backend, só linhas novas, com autorização do usuário). Testes do backend com
  `G2_ENGINES`/`ALL_ENGINES` (32 planetas). Ficha completa em `.claude/contexto/motores-g2.md`.
- **Motores:** os 16 registrados. Módulo compartilhado `engines/_api/` (mundo app→API→servidor, MatchBoard, peças de
  HTTP, visualizador de JSON). Sprites novos: weather, card, map, gamepad, plug, store, receipt.
- **Testado** no navegador interno (1440x900; os 16 também em 375 px no primeiro quadro, e 1.1/3.4 por inteiro no
  celular): todas as cenas/etapas, erro + acerto, conclusão e "Próximo planeta"; labs com "Jogar de novo" em 2.4 e 3.4
  (variação conferida). Console sem erros dos motores. Typecheck ok, 131 testes ok, `npm run build` ok (na 2ª
  tentativa — ver Next 16.4.0 nas pendências). NÃO testado: "Reduzir animações", tablet real, só teclado em todos.
- Ajustes de celular feitos: monte do MatchBoard compacto; 1.3 (botões longos quebram linha); 1.4 (cartões menores);
  3.4 (monte na área de interação, cartão encolhido); JSON nunca passa do palco (rola por dentro).
- `.claude/launch.json`: `g2-backend` (5011, DATA_SOURCE=local, contas em memória) e `g2-frontend` (next dev 3011
  apontando para a 5011) para testar com login sem tocar no Supabase; o `backend` (5000) ganhou CORS também para 3001.
- `frontend/config/labTiming.ts`: tempos min/avg dos 8 labs G2 preenchidos (estimativas, calibrar).

### Next.js 16.4.0 → 16.4.2 (22/10/2026)
O `npm run build` parava com aviso de vulnerabilidade. `npm audit` apontava 3 falhas CRÍTICAS no Next 16.0.0–16.4.0
(execução remota de código na otimização de imagens com SVG e em funções `use cache`; negação de serviço com Server
Actions). Atualizado para **16.4.2** (versão fixa em `package.json`; `package-lock.json` mudou — rode `npm install` ao
receber o zip). `npm audit`: 0 vulnerabilidades. Typecheck ok, `npm run build` ok na 1ª tentativa e sem aviso, `next
start` conferido (capa, /entrar, API). `.claude/launch.json` ganhou `frontend-prod` (next start na 3001).

### Transições mais suaves + 1.1 sem repetição (22/10/2026)
O usuário achou as transições "muito bruscas" e notou que o fim da Microinteração da 1.1 repetia a comunicação do clima.
- **Troca de cena:** `components/learning/sceneTransition.ts` (`playSceneIn`): o conteúdo do palco entra com fade +
  leve deslize (420 ms, Web Animations API, só opacity/transform, nada com movimento reduzido). Chamado no LessonShell a
  cada cena/"Rever aula" e no LabShell a cada "Jogar de novo" — vale para as duas galáxias.
- **Entradas dos elementos:** StageBanner e Callout do kit (G1 e G2) e os pops dos 16 motores G2 trocaram o salto em
  degraus (`steps(4)` saindo de 20–40% do tamanho) por um ease curto (de 94–96% e alguns px abaixo). Os "tremores"
  de erro continuam em degraus de propósito.
- **1.1:** a Microinteração agora anima a comunicação da loja (pagamento) ou do mapa (rota), sorteada por visita, e não
  mais a do clima (já mostrada nas cenas 1 a 3).
- Typecheck ok. NÃO conferido no navegador: o único `next dev` era o do usuário (3001, exige conta real) e o Next não
  deixa subir outro na mesma pasta.

## Decisões que continuam valendo
- A versão que volta do colega é a BASE OFICIAL: preserve as melhorias dele; não reverta sem motivo técnico forte.
- Python do colega: 3.12 (o do usuário: 3.14). Todo código Python precisa rodar em 3.12.
- Progresso só no navegador (`rota404.progress`). Endpoints de progresso/pontuação/conquistas/ranking/usuários
  continuam 501 (o schema real dessas tabelas no Supabase difere dos models — ver pendências).
- Desbloqueio sequencial dentro de cada sistema; "Liberar todos os planetas" em Ajustes para demonstrações.
- Feira: rodar frontend em PRODUÇÃO (`npm run build` + `npm start`) — o `next dev` pesa 6–7x mais e duplica efeitos.

## Pendências e decisões em aberto
- **Contas:** migration `20261022000000_accounts.sql` RODADA no Supabase em 22/10/2026 (colunas conferidas; login e ranking
  testados contra o banco real só com leituras). Há 5 linhas antigas de teste em `users` (sem apelido) e 1 em `scores`: ficam fora do ranking; apagar
  se quiser. Login sem limite por IP (só por apelido) e sessão única por conta — revisar se incomodar na feira.
- **G2, decisões a confirmar com a equipe:** falas criadas nas Microinterações e nos labs (o .md não define); 3.2: a
  pergunta "Qual produto tem este nome?" virou "Qual é o id do produto com o nome Mouse?"; 4.4: o ID errado (999) já
  vem digitado para cumprir a Etapa 1 do .md; 4.1 cena 4, 2.3 (16 missões) e 4.3 (causas e ações erradas) com textos
  criados; conquistas opcionais da 4.4 não feitas. Tempos dos labs G2 em `labTiming.ts` são estimativas.
- **HUD dos labs no celular:** a faixa Pontos/Tempo/Erros (LabShell) mede 379 px num celular de 375 px: a página
  rola 4 px para o lado em todos os labs (G1 e G2). Ajustar no LabShell.
- **Aula 1.1, microteste:** hoje só "dois aparelhos ligados" é resposta certa; "um aparelho com uma conexão" (cabo que
  não leva a nada) conta como errado. O .md fala em "exemplos" (plural) — confirmar com quem escreveu o .md.
- **Celular (≤ 375 px):** a StageBanner quebra em 2 linhas e cobre partes do mapa nos labs 2.3, 2.4 e 1.4; microteste
  da 2.1 apertado (IP digitado cortado); rótulos do mapa do 2.4 se sobrepõem. Precisa de decisão de layout mobile
  (ex.: faixa menor / rótulos ocultos abaixo de 480 px). Notebook e tablet estão ok.
- **Labs:** a altura da fala no painel do Bonzi (componente do colega) muda com o texto e faz a "Área de interação"
  pular ~45 px — sugestão: altura mínima fixa.
- **Lab 2.4:** resolvido em 23/10/2026 (a seta de ajuda agora vale só no cruzamento do erro). **Lab 2.3:** cada servidor recebe exatamente 1 domínio; o 3º sai por eliminação.
- **Tablets na rede da feira:** backend pronto (`HOST=0.0.0.0`, `CORS_ORIGINS=http://<IP>:3000`), frontend deriva a
  URL da API do host; `next dev` recusa outros aparelhos (use build+start); liberar portas 3000/5000 no firewall.
  NÃO testado em aparelho real.
- **Python 3.12:** compatibilidade verificada só estaticamente; rodar `python -m unittest discover -s tests` no 3.12.
- **Fontes:** `next/font/google` baixa as fontes no build → faça o build com internet (ou migre para `next/font/local`).
  Se o `next dev` subir sem internet, serve fonte de reserva (Arial esticada) até ser reiniciado.
- **Gamificação real:** `user_progress` no banco usa `entity_type/entity_id/progress_percent`; `scores` tem `galaxy_id`;
  `achievements` não tem `rarity` — os models/contratos do frontend precisam ser alinhados antes de implementar.
- **S4, decisões a confirmar com a equipe:** botão "Ver outra tentativa" na 4.1; apelido digitado na 4.2; caso
  "amigo com número novo" criado na 4.3; explorar as opções sem penalidade depois do acerto na 4.4; 4.2 com 5 cenas
  (o .md tem 6) e narração das pistas na 4.3 (pedidos do relatório de UX); "mais variedade" na 4.1 (não feito).
- **3.4 depois do relatório:** os botões no bloco dispensam achar o erro na página antes (os passos "tocar no erro" e
  "bloco destacado" do .md continuam, mas não travam mais). Confirmar com a equipe.
- **S3, decisões a confirmar com a equipe:** Montagem passiva na 3.2; "bloco repetido" como problema extra na 3.4;
  falas criadas onde o .md não define (todas marcadas no código). No celular (palco de ~320 px) as páginas do S3 são
  encolhidas por `transform` e o texto fica pequeno. Funciona, mas vale olhar num celular real.
- **Segurança do fluxo por zip:** `backend/.env` (com a chave secreta do Supabase) viaja dentro do zip. Mantenha o
  zip só entre a equipe ou envie o `.env` por outro canal. Recomendação forte: usar git (mesmo local) para versionar
  e ver diffs entre as rodadas.

## Portas na faixa 9000 (22/10/2026)
- Site (dev e produção) na **9000** (`next dev/start -p 9000` no package.json), API Flask na **9001** (`PORT` no `backend/.env`,
  default de `settings.py`, `API_PORT` em `services/apiClient.ts`). CORS liberado para 9000 e 9002 (produção de teste).
- `.claude/launch.json`: frontend-prod 9002, g2-frontend 9011, g2-backend 9012. `rodar.bat` abria a 3001 por engano; agora abre a 9000.
- Feira: liberar 9000 e 9001 no firewall; `CORS_ORIGINS` com `http://<IP>:9000`. Entradas antigas deste histórico citam 3000/5000.

## Alinhamentos apontados pelo usuário (22/10/2026)
- `_api/MatchBoard` (4.1 e 4.2): cabeçalho das caixas com altura fixa (nome em 1 ou 2 linhas, ícone por altura) e o
  cartão encaixado fica no topo da área, centrado: todos na mesma linha (medido: mesmo topo nas 5 caixas da 4.2).
- 1.2 Microinteração: as duas mensagens ficam em 33% e 67%, com a legenda centrada em cima e a seta do lado para onde
  a mensagem vai; no celular a legenda quebra em 2 linhas (sem encostar uma na outra).
- 2.3: botões dos métodos em flex (largura conforme o nome) com fonte fixa de 16 px: DELETE não vaza mais do painel.
- 4.1 cena 1: `AppCard` ganhou `anchor="left"` (centrado na altura) e o app de viagem fica na altura de onde saem os fios.

## Nível de conhecimento no cadastro (23/10/2026)
- `/entrar` (Sou novo aqui): pergunta obrigatória "Quanto você já sabe de tecnologia?" com 3 cartões (rádios nativos,
  setas do teclado): "Estou começando" / "Já sei um pouco" / "Já manjo bastante" → `knowledge_level` =
  `iniciante` | `intermediario` | `avancado`. [23/10/2026: agora escolhe a galáxia, ver "Galáxia pelo nível de conhecimento" no fim]
- Backend: `POST /api/users` aceita `knowledge_level` (opcional para clientes antigos; valor fora da lista → 400) e
  `PATCH /api/users/me` também; aparece no usuário público. Testes novos em `test_accounts.py` (133 no total).
- Supabase: rodar `supabase/migrations/20261023000000_knowledge_level.sql` no SQL Editor. Até rodar, o cadastro funciona
  igual: o `UserRepository` grava sem a coluna (`MissingColumnError` → tenta de novo sem `OPTIONAL_COLUMNS`).
- `/entrar` no celular: o botão "Criar conta e embarcar" vazava 18 px da tela (rolagem lateral); agora quebra a linha.
- Pendente: decidir se o nível muda algo no jogo (dicas, ordem, tempo dos labs) e mostrá-lo/editá-lo no Perfil.

## Voltar ao início e Finalizar viagem (23/10/2026)
- Página da galáxia (`/galaxias/[galaxySlug]`, as duas faixas): coluna à direita do título com "Voltar ao início" (capa)
  e "Finalizar viagem". Capa (`/`): "Finalizar viagem" abaixo dos botões, só com sessão (conta ou visitante).
- `components/auth/FinishJourney.tsx`: pede confirmação ("Sim, finalizar" / "Continuar jogando"), sai da conta e volta
  para a capa, pronta para o próximo aluno. Conta: progresso e pontos ficam no servidor. Visitante: o progresso local
  é apagado (o próximo visitante começa do zero).
- `SessionGate`: `exitToHome()` faz a saída seguinte ir para a capa em vez de `/entrar?voltar=...`.
- Testado no navegador interno (visitante): galáxia 1440 e 375 px, confirmação, cancelar, finalizar → capa sem sessão.

## Lab 1.3: ordem do caminho e dois aparelhos (23/10/2026)
Feedback dos testes: as pessoas achavam que a ordem das peças não importava e, na variante com dois aparelhos,
tentavam ligar um aparelho no outro.
- A área "Monte a rede" virou o caminho: colunas da esquerda (aparelhos) para a direita (internet), na ordem
  aparelho → Wi-Fi → roteador → internet (`layoutFor` em `network.ts`; só as colunas das peças da variante). Dois
  aparelhos ficam um em cima do outro na primeira coluna. Durante o arraste aparecem setas (`SPRITES.ui.next`) entre
  as colunas; somem na fase de ligar.
- Cada peça só entra na sua coluna. No lugar errado ela volta para a bandeja: faixa "Essa peça não vai aí", Bonzi
  "Essa peça não vai aí. Siga o caminho: do aparelho até a internet." e dica no painel. Sem penalidade.
- Ligar aparelho em aparelho não cria a ligação: faixa "Aparelho não liga em aparelho" + fala do Bonzi. Sem penalidade.
- Missão com dois aparelhos: "Ligue cada aparelho à Internet" (antes "Ligue os 2 aparelhos à Internet", lido como
  "ligue um no outro"); fala e dica do começo da ligação dizem que cada aparelho precisa do seu caminho.
- Interpretação da especificação (lab1-3.md diz "não exige uma posição geométrica exata"): a posição exata continua
  livre dentro da coluna, mas a ORDEM do caminho agora é exigida na montagem. Revisar com a equipe.
- Testado no navegador (1440 e 375 px): as três variantes, peça no lugar errado, aparelho↔aparelho, conclusão.

## Lab 2.4: ajuda só no cruzamento do erro (23/10/2026)
Feedback dos testes: depois de 2 erros a seta do Bonzi ficava ligada até o fim e entregava todos os passos seguintes
(inclusive o servidor certo), sem a criança poder tentar.
- `help` em `missao-encontrar-o-servidor/index.tsx`: 2 erros ou mais no total (`HELP_AFTER`) E algum caminho sem
  saída do cruzamento atual já tentado. Num cruzamento novo não há seta; se a criança errar ali, a seta aparece.
- A fala "Vou ajudar: siga a seta até o próximo passo." é dita uma vez por cruzamento (`helpSaidAt`), não uma vez só.
- Continua de acordo com o .md ("Após algumas tentativas, Bonzi pode destacar a direção do próximo passo").
- Testado no navegador (1440): 2 erros no Wi-Fi → seta ali; roteador sem seta; 1 erro na internet → seta ali;
  servidores sem seta; conclusão.

## Labs: pontos escondidos durante o jogo (23/10/2026)
- Pedido: a criança não deve ver a pontuação diminuindo; só no fim do laboratório.
- `LabShell.tsx` (`LiveHud`): durante o jogo o placar mostra só Tempo e Erros; "Pontos" aparece quando o lab termina
  (mesmo valor da tela de conclusão). A fórmula (`labScore`) e o que é gravado não mudaram. Vale para todos os labs
  das duas galáxias (todos usam o LabShell).
- Testado no navegador (lab 2.4, 1440 e 375 px): placar sem pontos durante o jogo, com 1 erro; pontos no fim;
  "Jogar de novo" esconde de novo.
- A decidir com a equipe: o contador de Erros e o cronômetro continuam visíveis.

## Bonzi: poses paradas em vez de animação (23/10/2026)
- Pedido: tirar a animação do Bonzi (a equipe fez sprites, não animações) e só trocar de sprite de vez em quando.
- Removidos os movimentos em CSS da figura: flutuar, falar, pular, balançar, tremer e subir e descer
  (`BonziBuddy.module.css` e o retrato do `Narrator.module.css`). Continuam o balão aparecendo (`pop`) e o aviso
  de fala nova com o balão fechado (`ping`), que não mexem no Bonzi.
- As poses trocam direto, sem transição, a cada `BONZI_POSE_MS` (3 s; antes falando trocava 5 vezes por segundo).
  Parado: pose 0 e, de vez em quando, a pose 1. Falando: 0 e 4. Pensando: 1 e 2. Feliz, aviso e ajuda: uma pose só.
  Com "Reduzir animações", só a pose principal.

## Logo: logo_enhanced também na barra do topo (23/10/2026)
- A barra do topo (`MainNav`) usava a logo antiga pequena (`logo-small.png`, 153x27). Agora usa a mesma
  `logo_enhanced` da capa (`SPRITES.brand.logo`, cópia de `assets/logo/logo_enhanced.png`), em 173x72 (×1 da arte de
  173x72; é a única escala inteira que cabe na barra de 76 px). Abaixo de 560 px continua o compass. Removida a
  constante `SPRITES.brand.logoSmall` (o PNG ficou em `public/sprites/brand/`).
- Existe outro `logo_enhanced.png` em `sprites geral/assets/` (941x404, ~2.000 cores, parece um redimensionamento
  suavizado, sem pixels nítidos). Não foi usado; confirmar com a equipe qual é o oficial.
- Testado no navegador (1440, 1024, 768, 600 e 375 px): cabe na barra, sem rolagem lateral. Também conferido o retrato
  do Bonzi nos labs (sem movimento, troca de pose a cada 3 s), que tinha ficado sem teste na rodada anterior.

## Navegação: atalhos, um toque para entrar e trilha curta no celular (23/10/2026)
Pedido: "melhorar a navegabilidade". Percorri o app como visitante e a usuária escolheu 3 das 4 propostas (a 4ª,
nomes no menu do topo abaixo de 1100 px, ficou de fora).
- **Atalhos diretos** (`hooks/useJourney.ts`): a criança só tem uma galáxia liberada (a da idade), então o "Mapa" do
  menu e o "Ver mapa" da capa abrem direto essa galáxia (antes: lista de galáxias, com 1 só liberada). "Continuar
  viagem" (capa, com sessão) abre o próximo planeta a fazer: o primeiro disponível ou em andamento, sistema por sistema;
  tudo concluído → a galáxia. Sem faixa conhecida, tudo continua indo para `/galaxias`.
- **Um toque para entrar** (`components/space/useRouteTravel.tsx`): tocar numa galáxia, sistema ou planeta faz a nave
  voar até lá e já entrar (pouso + hiperespaço). Saiu o cartão do Bonzi "Quer entrar?" / "Entrar" / "Agora não" (e a
  fala dele). Teclado: Enter no destino faz o mesmo. Com "Reduzir animações", entra direto.
- **Trilha no celular** (`Breadcrumbs` `compact`): até 560 px a trilha (antes 4 linhas) vira um botão
  "Voltar para <nível de cima>"; nas aulas/labs ela some (já existe "Voltar ao sistema").
- Testado no navegador (visitante, 1440 e 375 px): atalhos (sem progresso → 1.1; com 1.1 concluída → 1.2), "Mapa",
  galáxia → sistema e sistema → aula com um toque (sem cartão), Enter pelo teclado, trilha curta, sem rolagem lateral.

## Ênfase no próximo passo dos mapas (23/10/2026)
- Pedido: dar ênfase aos elementos certos em cada situação para guiar a criança, sem exagero.
- Os botões já tinham ênfase (`attention`): "Próxima cena" nas aulas, "Próximo planeta" na conclusão, "Próximo
  sistema" com o sistema completo, botões dos motores. Faltava nos mapas, onde nada indicava por onde seguir.
- `MapNode highlight`: anel amarelo "respirando" (2,2 s, opacidade 0,4–1, só transform/opacity) atrás do destino,
  legenda com borda amarela e a etiqueta "Próximo". Um destino por mapa:
  - lista de galáxias: a galáxia da criança (só quando a faixa é conhecida);
  - galáxia: o primeiro sistema (na ordem) não concluído;
  - sistema: o primeiro planeta disponível ou em andamento (some quando o sistema está completo, e aí a ênfase passa
    para "Próximo sistema", como já era).
- Com "Reduzir animações" o anel fica parado (regra global).
- Testado no navegador (1440 e 375 px): 1.1 concluída → 1.2 marcada no sistema, Sistema 01 marcado na galáxia,
  Internet e Web marcada na lista; leitor de tela lê "próximo passo"; sem rolagem lateral.

## O Bonzi lê também o "O que fazer" (23/10/2026)
- Pedido: as instruções escritas do painel (ex.: "O que fazer" do lab) não eram faladas; muitas crianças não leem bem.
- `components/learning/GuideVoice.tsx`: `useGuideVoice` lê o texto do painel do guia depois que o Bonzi termina a
  fala dele (aula: "O que fazer"/"Muito bem! Agora toque em Próxima cena"; laboratório: o feedback de qualquer tom).
  Texto igual à fala do Bonzi não é repetido. Botão "Ouvir" ao lado do texto, no estilo do "Repetir".
- `narrationService.speak({background: true})`: a leitura de apoio não conta como "o Bonzi está falando", senão o
  "Próxima cena" ficaria travado e os motores (`whenIdle`) esperariam a leitura. Uma fala nova do Bonzi corta a leitura.
- A faixa do palco (StageBanner) NÃO é lida: é um título curto que repete a instrução do painel.
- Testado no navegador (voz do navegador substituída por um registro): lab 1.3 (fala do Bonzi → leitura da dica;
  erro: aviso do Bonzi → dica nova), aula 1.1 (instrução e "Agora toque em Próxima cena", com o botão liberado durante
  a leitura), botão "Ouvir", 1440 e 375 px.

## Lab 1.3 com um aparelho só; Lab 1.4 com o erro no computador (23/10/2026)
- **1.3:** pedido da equipe: "o ideal é 1 dispositivo, o Wi-Fi, Roteador e Internet, nada mais nada menos". `VARIANTS`
  agora é computador OU celular, sempre com Wi-Fi, roteador e internet (saíram "computador + roteador + internet" e
  "dois dispositivos", que estão no lab1-3.md: DESVIO da especificação, decidido pela equipe). O PC também vai pelo Wi-Fi
  (`FORWARD.pc = ["wifi"]`) e a dica de conceito dele mudou. Saiu o código só dos dois aparelhos (aviso "Aparelho não
  liga em aparelho", textos "cada aparelho", duas vagas na primeira coluna).
- **1.4:** na falha do computador (ligado na impressora), o "Parou aqui!" e o anel vermelho ficavam na impressora, mas o
  conserto é no computador. Agora o balão fica no computador com o texto "Caminho errado!" e a impressora não fica
  vermelha (o pacote ainda vai até ela, mostrando o caminho errado). As outras falhas não mudaram (o pacote para na
  própria peça com problema).
- Testado no navegador (1440): 1.3 computador com 4 peças até "Laboratório concluído" (10.000), variante celular com 4
  peças; 1.4 falha do computador: balão no computador, impressora neutra, conserto e conclusão. Não testado no celular.

## Logo da barra do topo: só o letreiro (23/10/2026)
- A equipe mandou a logo sem o foguete e as estrelas para a barra do topo (salva em `assets/logo/logo_bar.png`, 865x360
  como a logo_enhanced). Para a barra, o letreiro foi recortado e reduzido à arte nativa: `public/sprites/brand/logo-bar.png`
  (155x29, 21 cores, sem perda) = `SPRITES.brand.logoBar`, exibido ×2 (310x58) na barra de 76 px: o "ROTA 404" ficou
  bem maior que com a logo inteira em ×1. A capa continua com a logo_enhanced completa.
- Testado no navegador: 1440, 1024, 768 e 600 px (cabe antes do menu, sem rolagem lateral); 375 px mostra o compass.

## Perfil: moldura quadrada em volta do avatar (23/10/2026)
- O avatar do perfil tem quadro quadrado, mas em volta girava um anel tracejado redondo. `.orbit` em
  `app/perfil/page.module.css` virou uma moldura tracejada QUADRADA e parada, 20 px em volta do quadro (216 px).
  O brilho elíptico embaixo (`.pad`) continua. Testado no navegador (1440 e 375 px).

## Mapa da galáxia, layout do sistema, "Repetir" e falas sem cortes (23/10/2026)
- **"Quer entrar?" de volta só no mapa da galáxia** (sistemas): `useRouteTravel({confirm})` / `SpaceMap confirmEnter`.
  Lista de galáxias e página do sistema continuam com um toque.
- **Página do sistema:** os planetas eram posições fixas numa elipse e um rótulo alto ("Próximo" + nome de 4 linhas)
  ficava embaixo do planeta seguinte. Agora é uma grade de 2 linhas (esquerda | sol | direita, `orbitCell`): as linhas
  crescem com o rótulo, então nenhum rótulo alcança outro planeta, em qualquer sistema. A elipse tracejada que passava
  atrás dos planetas (`.outerRing`) saiu. No celular continua a grade de 2 colunas.
- **"Repetir" da aula** repetia só a última fala; agora fala todas as falas da cena, na ordem.
- **Falas sem cortes:** fila de falas nos shells (`useBonziLine`), "ocupado" inclui a fila, leitura do "O que fazer"
  espera o Bonzi e fala frase por frase (ver `runtime-shells-e-kit.md`). Corrige: (1) na troca de cena a instrução nova
  começava antes do Bonzi e era cortada por ele ("fala a caixa e corta"); (2) motores que pedem duas falas seguidas ou
  ações da criança durante a fala cortavam a fala anterior (ex.: G1 2.1 cena 1 e várias cenas da G2).
- **Bug antigo corrigido em `narrationService`:** um `stop()` (troca de cena, sair da tela) deixava "falando" ligado
  para sempre (o `finish` cancelado não desligava), e o "Próxima cena" podia travar em "Escute o Bonzi até o fim".
  Agora `cancelCurrent` marca silêncio (menos quando uma fala nova já vai começar).
- **Teste das falas (navegador interno, voz do navegador trocada por um registro que acusa fala cancelada antes do
  fim):** um robô jogou os 32 planetas (G1 e G2) tocando em tudo, inclusive no meio das falas, e avançando cenas.
  Resultado: nenhuma fala cortada dentro de cena. Os únicos cortes registrados foram o próprio robô saindo da página
  ou tocando em "Próxima cena" durante a leitura do "O que fazer" (ações da criança, esperado). G2 2.1 e G1 4.2 pedem
  digitação: foram completadas à mão (erro e acerto em seguida, sem corte). "Repetir" e "Quer entrar?" conferidos.
  Layout dos 8 sistemas sem sobreposição em 1440, 1024 e 768 px.

## Tela /entrar (criar conta e já tenho conta) redesenhada (23/10/2026)
- Pedido: as telas de criar conta e entrar estavam feias. A lógica (cadastro, login, visitante sem servidor, erros,
  voltar para a página de origem) não mudou; mudou a apresentação em `app/entrar/page.tsx` e `page.module.css`.
- Computador: à esquerda um "cartão de embarque" (logo da barra + ficha que se monta enquanto a criança preenche:
  personagem, apelido, universo pela idade com o sprite da galáxia, nível); à direita o formulário com as abas
  "Criar conta" / "Já tenho conta" presas no painel. Cadastro em 3 etapas numeradas (Sua conta, Sobre você, Seu
  personagem); a idade mostra na hora "Seu universo: Internet e Web / API REST" (até 13 / 14+, mesma regra do
  servidor). Campos com a fonte do corpo (mais legível), botão principal na largura toda e o atalho "Ainda não tem
  conta? Criar conta" / "Já tem uma conta? Entrar". "Já tenho conta" fica curto (apelido, senha, Entrar).
- Tablet e celular: uma coluna, cartão compacto (personagem ao lado dos dados) em cima do formulário.
- Testado no navegador (1440, 768 e 375 px): ficha ao vivo, troca de abas, erro "Preencha o apelido e a senha.",
  sem rolagem lateral (o botão "Criar conta e embarcar" quebra a linha no celular). Não foi criada conta de teste
  (gravaria no Supabase real).

## Galáxia pelo nível de conhecimento, não pela idade (23/10/2026)
- Pedido da equipe. Regra: **13 anos ou menos** → "Estou começando" e "Já sei um pouco" = galáxia 1 (Internet e Web);
  "Já manjo bastante" = galáxia 2 (API REST). **14 anos ou mais** → "Estou começando" = galáxia 1; os outros = galáxia 2.
- O modelo de dados não mudou: a galáxia continua ligada à faixa (`age_range_id`); só a ESCOLHA da faixa mudou.
  Backend: `UserService._age_range_for(age, level)` (faixas ordenadas por `min_age`: a 1ª é a galáxia 1, a última a 2);
  cadastro e `PATCH /users/me` (idade OU nível novo recalcula). Sem nível (contas antigas, cliente antigo), vale a idade.
  Testes novos em `test_accounts.py` (135 no total).
- Frontend: a mesma regra em `lib/galaxyTrack.ts` (`goesToAdvancedGalaxy`), usada na ficha ao vivo do `/entrar` e no
  "Jogar sem conta" (`playAsGuest(age, avatar, level)`; sem nível, pela idade). O aviso "Seu universo" do cadastro saiu
  de perto da idade e foi para depois dos níveis (depende dos dois). Fala do Bonzi do cadastro ajustada.
- Os nomes das faixas do catálogo ("13 anos ou menos"/"14 anos ou mais") ficariam errados na tela para quem foi pelo
  nível; o catálogo NÃO foi alterado (exigiria Supabase + seeds). Na tela, `trackName` mostra "Primeiros passos" /
  "Mais desafios" (perfil, cabeçalho da galáxia, /faixas-etarias) e o perfil/configurações mostram o nome da galáxia
  ("Universo: Internet e Web"). Textos "a sua idade escolheu o seu universo" trocados.
- Contas criadas ANTES desta mudança mantêm a galáxia que tinham (não há migração). Pendência: decidir se vale recalcular
  as contas existentes no Supabase.

## Dublagem do Bonzi (23/10/2026)
- A equipe gravou as falas da lista `falas-do-bonzi.md` (399 mp3, 389 textos diferentes, `_indice.csv` com pasta;arquivo;fala).
  Os mp3 foram copiados para `frontend/public/audio/bonzi/<grupo>/<nn>.mp3` (+29 MB no zip) e `config/bonziVoice.ts` liga
  texto → arquivo. O `narrationService.speak` toca a gravação quando acha o texto; senão usa a voz do navegador.
  Nenhum motor/página mudou: todas as falas passam pelo `speak` (shells, balão, "Quer entrar?").
- Testado no navegador interno: aula 1.1 da G1 tocou `g1-1-1/04.mp3` inteiro (3,8 s) e só depois o painel foi lido.
- Continuam com a voz do navegador: falas com trecho que muda (49 moldes, lista em `_falas-variaveis.txt` da dublagem,
  ex.: IP sorteado na 2.4, `Ainda não. {need}` dos labs da G2, "Bem-vindo de volta, {apelido}") e a leitura do painel
  "O que fazer"/feedback (GuideVoice), que nunca foi gravada. Pendência: decidir se grava essas falas (as variáveis
  podem ser gravadas uma por valor) ou se desliga a leitura do painel para não misturar vozes.
- Atenção: mudar o texto de uma fala no código desliga a gravação dela (volta a voz do navegador) até regravar.
- (mesmo dia, depois) "Ainda há falas com a voz antiga": não era gravação que deixou de ser achada (todas as 389 tocam).
  Eram falas que nunca entraram na lista gravada: (1) a leitura do painel "O que fazer" e do feedback dos labs
  (~480 textos), (2) ~100 falas do Bonzi que a 1ª extração não achou (faixas dos labs 2.3/2.4 que o Bonzi fala,
  "Ainda não. ..." de cada peça nos labs da G2, erros da 3.1 e da 4.3), (3) ~85 moldes com trecho variável.
  Lista para gravar: `falas-faltando.md` (raiz; refeita, ver item seguinte).
  Importar o lote novo: `cd frontend; node scripts/importar-dublagem.cjs "<pasta com _indice.csv>" . --add`.
  Em desenvolvimento o console mostra `[Bonzi] sem gravação: <texto>` para cada fala sem gravação.
- (depois) Pedido: TODAS as falas, sem exceção; o apelido falado vira "viajante". Feito:
  - `narrationService`: sem gravação da fala inteira, divide a fala em pedaços (fim de frase e "Rótulo: ") e toca uma
    gravação por pedaço, se todos tiverem ("Ainda não." + o motivo, "Remetente:" + a pista, efeitos do conserto...).
    Ainda nunca mistura as duas vozes numa fala.
  - `config/bonziVoicePatterns.ts`: moldes com `*` para valor livre → gravação fixa (apelido → "viajante", pontos,
    caminho digitado na G2 2.1, várias falhas na G2 2.4, campos na G2 3.4, caminho na G2 3.3). O texto na tela não muda.
  - `falas-faltando.md` refeita: 1262 linhas, nenhuma com trecho variável (valores enumerados do código: domínios/IPs da
    2.4, contadores "Faltam N", "Pergunta N de M", explicações de UM problema da G2 2.4, nomes de sistemas/galáxias...).
    Erra para mais: inclui alguns textos de faixa e combinações que não acontecem (gravar a mais não atrapalha).
  - Teste isolado da escolha de gravação (inteira, pedaços, moldes, volta à voz do navegador): 7/7.
- (depois) 2º lote da dublagem importado (`--add`): 1262 mp3, todos ligados. `bonziVoice.ts` tem 1651 falas;
  `public/audio/bonzi` passou a ~98 MB (o zip cresce). Conferência no código: nenhuma fala falada fica sem gravação
  (sobram só 2 combinações impossíveis da G2 3.4 e chaves internas de dica da G2 3.3, que não são faladas).
  Testado no navegador interno: aula 1.1 G1, lab 2.4 G1 (com erro: fala montada por pedaços) e aula 1.1 G2 — só
  gravações, nenhuma fala com a voz do navegador.
- BUG corrigido no caminho (`useBonziLine`): no modo de desenvolvimento o React monta os componentes duas vezes; a
  limpeza da fila mudava a "geração" e a fala da abertura ficava presa como "atual" para sempre → o Bonzi ficava MUDO
  no laboratório inteiro (e a 1ª fala da 1ª cena das aulas sumia). Agora a fila usa `alive` (para só quando o shell
  sai da tela de verdade). Em produção (build+start) isso não acontecia.

## Ajustes da G2 sem falas novas + telas sem rolagem (24/10/2026)
Regra desta rodada: o Bonzi está dublado, então NENHUMA fala nova; explicações extras são ESCRITAS (palco, cartões),
nunca por `say`/`setHint`/`feedback` (que são lidos em voz alta). Detalhes por planeta em `motores-g2.md`.
- **G2 1.2 (Cena 6):** motivo do acerto escrito no palco (3,2 s); toque numa peça já descoberta ou logo após o acerto
  não conta mais como erro (antes: errado → certo → tocar de novo dava "Ainda não").
- **G2 1.4 (Organizar):** `OrderCards uniform` (kit): cartões da mesma largura, ícones na mesma altura, nomes alinhados.
- **G2 2.1:** Cena 1 com as três partes da URL ficando na tela (tocar destaca); Cena 4 com endpoints tocáveis que
  escrevem o caminho no campo (`AnswerInput fill`, kit), exemplo `/users/42` e molde `/recurso/número`.
- **G2 2.2 (Cena 1):** pausas de leitura antes do 1º cartão e depois de cada um.
- **G2 2.3:** verbo da missão em destaque, dica escrita no cartão e o item citado marcado na lista.
- **G2 4.3:** "Próximo caso" pelo toque (era automático); botões da conta simulada empilhados dentro da caixa.
- **Telas sem rolagem** (pedido: "todas as telas do tamanho da tela"): `AppShell fit` + `FitToHeight` (ver
  `frontend.md`). Medido em 1280×720, 1366×768, 1440×900 e 1920×1080: nenhuma página rola (início, mapas, os 32
  planetas, perfil, conquistas, ranking, ajustes, universos, entrar). O que mudou de estrutura: perfil em 2×2, ajustes em
  3 colunas, conquistas bloqueadas compactas e lado a lado, cadastro em duas colunas, ranking com a lista rolando por
  dentro, coluna lateral dos labs com a altura do palco (rola por dentro; botões presos embaixo, sempre à vista) e mais
  larga quando o palco não usa a largura toda; caixa "O que fazer" do lab com o texto na largura toda. O Bonzi do
  cadastro fica no canto esquerdo (à direita cobria o botão).
- Limites: abaixo de 900px (celular, tablet em pé) as páginas rolam como antes. No tablet deitado (1024×768) as páginas
  cabem, mas aulas e labs ainda rolam (abaixo de 1180px o guia fica embaixo do palco); mudar isso encolheria o palco.
  Labs com coluna que rola por dentro em 1280×720: G1 2.3, 2.4, 3.3 e G2 1.3, 2.4, 3.4, 4.3, 4.4 (até 138px).
- Corrigido no caminho: a nave e as ligações do mapa usam as medidas desfeitas da escala (com o mapa encolhido, a nave
  sairia do lugar).
- **Correções de alinhamento (mesmo dia, depois de jogar em telas mais altas, ~1486×920 e 1616×1000):** a coluna lateral
  da aula/lab tinha mínimo menor que o original (290/300px) e, em telas altas (palco limitado pela largura), "Próxima
  cena" saía da caixa "O que fazer" → mínimos voltaram aos originais (aula 330px, lab 350px). Perfil: a pontuação
  ocupa a linha toda dos dados (o número grande saía da caixa) e os painéis lado a lado esticam até a mesma linha;
  no AvatarPicker, cartão mais estreito que o avatar (6 por linha em ~1280px) mostra o avatar a 2/3 (64px, escala
  inteira) por container query, em vez de passar 3px da borda.
  Ajustes: as três colunas terminam na mesma linha e "Apagar dados deste aparelho" quebra a linha em vez de sair da
  caixa (seletor com tag: `.actions > *` perdia para o `.button` do SpriteButton). Conquistas: as seções
  "Desbloqueadas"/"Bloqueadas" ganharam o vão que o `<main>` dava (dentro do FitToHeight não há vão). Medido sem nada saindo das caixas em 1280×800, 1486×920, 1536×864 e 1616×1000 (páginas e 32 planetas).

## Conquistas (24/10/2026)
Pedido: implementar a tabela de conquistas da equipe (raridade, código, como desbloquear, ícone) e o easter egg do suco
de abacaxi. Fonte: o print da tabela (a planilha `conquistas.xlsx` dos Downloads era uma versão anterior: lá R-01 era
"completar uma galáxia" e L-03 era "galáxia sem erro"; no print isso virou L-03 e B-01).
- **19 conquistas** = as linhas com regra: C-01…C-06, R-02…R-05, L-01…L-04, B-01, B-02 (o print repete "B-01"; a
  segunda virou B-02), S-01…S-03. Sem regra na tabela, ainda não existem: C-07, R-01, R-06, R-07, L-05…L-07.
- **Títulos**: a coluna estava vazia; inventados. Para trocar: `frontend/config/achievements.ts` + seed.sql, seed.json e a
  migration (o teste `test_frontend_config_matches_the_catalog` confere nome, slug e raridade) + rodar a migration.
- **Interpretações** (também no topo de `lib/achievements.ts`): "sem cometer nenhum erro" num sistema/galáxia = todos os
  planetas concluídos e cada laboratório concluído alguma vez com 0 erros (aulas não contam erros); "refazer" = concluir
  de novo um laboratório já concluído; "refazer todos os laboratórios" = os 8 de uma galáxia; "ranking geral" = ranking da
  galáxia; "pontuação máxima" = 10.000; "personalizar o perfil" = trocar de personagem no perfil (o apelido não muda);
  S-01 = apelido "Piaba" (sem diferenciar maiúsculas) com o personagem Piaba (só com conta); S-02 = abrir qualquer rota
  que não existe (página 404) ou digitar um recurso que não existe na Cena 4 da aula G2 2.1 (é o único lugar em que se
  digita um endereço: não há laboratório com URL livre); L-03 usa o ícone de galáxia (o "Galáxia" era da R-01, que
  ficou vazia; o print dá "Cérebro" para a L-03). C-06 e B-02 não tinham ícone: "refazer" (setas em círculo).
- **Onde fica**: regras no frontend; cópia no aparelho (`rota404.achievements`, por dono) e, com conta, no servidor
  (`POST /achievements/me`, idempotente; `user_achievements`). Visitante: só no aparelho e sem as de ranking. "Sem erro"
  e "vezes concluído" são novos no progresso local (`flawless`, `completions`) e só contam daqui para frente.
- **Arte**: as medalhas originais não tinham os ícones da tabela (coração, crachá, chapéu…). `scripts/gerar-conquistas.py`
  apaga o desenho do meio das molduras originais (comum = círculo azul, rara = losango dourado, lendária = rosa com
  espinhos), recolore para Brutal (vermelho) e Secreta (verde-água) e desenha ícones 12x12 nos tons da moldura. São
  provisórias: trocar o PNG de mesmo nome em `public/sprites/badges/` basta.
- **Suco de abacaxi (S-03)**: `components/space/PineappleJuice.tsx` no `AppShell` (fora das aulas/labs). Primeira chance
  8–20 s depois de abrir a página, depois a cada 30–70 s, 50% de aparecer (depois ficou mais raro: ver "Ajustes" abaixo); atravessa a tela em 15 s (com "Reduzir
  animações", fica parado 9 s). Tocar = conquista + some com um "gole".
- **Avisos**: `AchievementToasts`, escrito, sem fala nova do Bonzi (regra da dublagem). Mais de 3 de uma vez (ex.: a
  primeira vez que alguém com progresso antigo abre o app) viram um aviso só.
- **Página /conquistas**: grade única com as 19 medalhas compactas (7 por fileira em tela larga, ordem das raridades) +
  painel de detalhe da escolhida. Primeiro foram grupos por raridade com o texto em cada cartão: em 1280×720 precisava
  encolher para 57%. Com `auto-fill`, a 8ª coluna quebrava os nomes em mais linhas e uma barra de rolagem "fantasma"
  aparecia e sumia (com a barra voltava a 7 colunas e cabia): por isso 7 fixas.
- **Testado** (servidor local em memória na porta 9003, conta de teste "Piaba"): S-01 ao abrir o perfil; progresso de
  lab 10.000 sem erro e refeito → C-02, C-04, C-05, C-06, R-02, L-01 num aviso só; ranking → R-04, R-05, L-04; suco →
  S-03; 404 aberto direto → S-02; troca de personagem → C-01; tudo gravado na conta e no aparelho. /conquistas e /perfil
  sem rolagem em 1280×720, 1440×900 e 1920×1080; celular sem rolagem lateral. Backend: 139 testes OK (Python 3.12);
  typecheck OK. **Não testado**: um laboratório jogado de ponta a ponta gravando `flawless`/`completions` (testado só pelo
  progresso simulado) e a Cena 4 da aula G2 2.1 com recurso inexistente.
- **Pendência**: rodar `supabase/migrations/20261024000000_achievements.sql` no SQL Editor do Supabase. Sem isso, o
  servidor responde 404 ao gravar e as conquistas ficam só no aparelho (voltam para a conta na próxima entrada depois
  de rodar).

## Pixel arts originais da equipe + personagens novos + conquistas no ranking (24/10/2026)
Pedido: usar TODAS as pixel arts do pacote `public` da equipe (Downloads/public-20261024T052544Z-1-001), "todas
originais, inclusive as badges; se tiver que repetir, no máximo muda a cor"; planetas na ordem certa; personagens
novos; quantidade de conquistas no ranking.
- **public espelhado** (rsync --delete, menos `audio/`, que era idêntico): 45 arquivos novos (32 planetas
  `planets/planet_gXsYpZ.png`, 8 sóis `suns/sun_gXsY.png` + `sun.aseprite`, 3 personagens, `pineapple-juice.png`),
  40 substituídos (ícones de ui/status/space, estrela e placeholder agora na arte nativa 16x16 — antes eram ampliações
  128x128 —, elementos, galáxias ~50px — antes 512 —, logo-bar 157x31) e 30 removidos (planetas antigos `planet-N.png`
  e as artes que eu tinha gerado: 19 medalhas e o suco).
- **Planetas e sóis por posição** (`config/assets.ts`): `PLANET_SPRITES[slug]` = planet_g<galáxia>s<sistema>p<planeta>
  (G1 Internet e Web, G2 API REST; sistemas e planetas por order_index); `SYSTEM_SPRITES[slug]` = sun_g<g>s<s> (centro
  do sistema e nó do mapa da galáxia). O `sprite_key` dos planetas no banco deixou de ser usado (`PlanetSlot.slug`).
  Início: "Planetas" usa o planeta 1.1; ranking: aba "Por sistema" usa o sol do 1º sistema.
- **Medalhas**: cada original no máximo uma vez para comum/rara/lendária (escolhidas pelo desenho: crachá = Traje novo,
  "3" = Pódio do sistema, raio = mais de 9.000, óculos = Mente brilhante, relógio = Nota máxima, foguete com coroa =
  Viajante da galáxia…; tabela em `BADGE_ART`). Brutal = lendárias repetidas em vermelho; Secreta = as duas que sobraram
  (comum-4, rara-4) e uma repetida (rara-2) em verde-água — `scripts/gerar-conquistas.py` agora só recolore.
- **Suco de abacaxi**: a caixinha original (10x19) em 3x.
- **Personagens**: Amogus, Hello Kitty (slug `hello-kitty`, arquivo `hello_kitty.png`: o servidor só aceita a-z, 0-9 e
  hífen) e Six Seven. No perfil, os 9 ficam com 64px (2x) em duas fileiras de 5 (`AvatarPicker avatarSize`); no
  cadastro, grade 3x3 com 96px.
- **Ranking**: cada linha e o pódio mostram a medalha com o número de conquistas da conta (todas, não só do escopo);
  a frase "Você está em…" também. Backend: `RankingEntry.achievements` (contagem de `user_achievements`), teste novo.
- **Não feito (decisão)**: os ícones de 16px aparecem em 20–28px (escala não inteira), como antes acontecia com as
  ampliações de 128px (mesma nitidez). Arredondar todos os tamanhos para múltiplos de 16 mexeria no encaixe das telas
  sem rolagem; fica como melhoria possível.

## Ajustes: nome de personagem, caixas dos personagens, suco mais raro, sóis em sequência (24/10/2026)
- **Personagem**: o "Fantasma" (arquivo `ghost-spec.png`) passou a se chamar "Gustavo Pereira" (pedido da equipe).
- **Caixas dos personagens** (`AvatarPicker`): nomes longos (Hello Kitty, Gustavo Pereira) quebram em duas linhas e
  deixavam a caixa mais alta que as vizinhas; agora `grid-auto-rows: 1fr` e o cartão ocupa a célula: todas as caixas
  da grade têm a mesma altura (cadastro e perfil).
- **Suco de abacaxi mais raro**: primeira chance 1–2 min depois de abrir o site, depois a cada 3–6 min, 40% de
  aparecer. O horário da próxima chance fica no módulo (`nextChanceAt`): trocar de página não reinicia mais a
  contagem (antes cada página nova dava uma chance em 8–20 s, por isso parecia frequente).
- **Sóis em sequência** (didático): na galáxia, um sistema só libera quando o anterior estiver concluído
  (`isSystemUnlocked` em `lib/progress.ts`). Valem também a página do sistema (todos os planetas bloqueados) e o
  acesso direto pela URL (`PlanetScreen` → `LockedPlanet` com o texto escrito "Conclua o sistema anterior para liberar
  este."). O Bonzi repete a fala dublada "Conclua o planeta anterior…" (sem fala nova).
  Exceções: "Liberar todos" em Ajustes (texto agora "Abre qualquer sistema e planeta…") e sistemas que já têm
  progresso (para não esconder o que a criança começou antes da regra).

## Login, troca de pessoa no aparelho e bloqueio de planetas (24/10/2026)
- **"Já tenho conta" redesenhado** (`app/entrar`): à esquerda, a tripulação (os 9 personagens, 64px = 2x, flutuando
  fora de sincronia) e a rota galáxia 1 → nave → galáxia 2 (galáxias em 2x); à direita, um "Painel de decolagem"
  com luzes piscando, título visível "Entrar na conta", campos com ícone (capacete = apelido, chave = senha; o ícone
  acende com o foco) e "Primeira vez por aqui? [Criar conta]" como botão. Só transform/opacity; para com "Reduzir
  animações". Em uma coluna (< 900px) a tripulação some para o formulário não descer. Cadastro sem mudança.
- **Cartão "Você já entrou" piscando depois de entrar**: o status virava "signed-in" antes da navegação; agora o
  cartão só aparece se a pessoa abrir /entrar já logada (`!busy`).
- **Próxima pessoa caía na página de quem saiu**: o `SessionGate` mandava para `/entrar?voltar=<página>` também
  depois de "Sair da conta". Agora, se a sessão acabou nesta aba, vai para `/entrar` sem `voltar` e esquece onde a
  nave parou em cada mapa (`rota404.parked`). O `voltar` continua para quem abre um link sem sessão.
- **Visitantes herdavam o progresso um do outro**: todos tinham o dono "guest". Agora cada "Jogar sem conta" ganha
  um id (`guest:<id>`, `useSession().owner`, usado por progresso e conquistas). Sessões de visitante antigas, sem
  id, continuam como "guest".
- **Planeta bloqueado no meio de planetas feitos** (ex.: 1.2 bloqueado com 1.3 concluído e 1.4 em andamento): acontece
  quando planetas foram feitos fora de ordem — "Liberar todos" ligado e depois desligado (o ajuste é do aparelho,
  vale para todas as contas), o progresso herdado entre visitantes ou o `voltar` para a página de outra pessoa.
  Regra nova em `computePlanetState`: um planeta sem registro também fica disponível se algum planeta seguinte do
  sistema já tiver registro.
- **Sem anel amarelo no "Próximo"** (pedido da equipe: "acho bem feios"): o círculo amarelo pulsando atrás da galáxia,
  do sol ou do planeta destacado (`.nextRing` do `MapNode`) foi removido. O próximo passo continua marcado pela
  etiqueta "Próximo" e pela borda amarela da legenda.

## Fim de laboratório sem voz + tela tremendo/andando para o lado (24/10/2026)
- **Fim do laboratório só escrito**: "Laboratório concluído! Você fez N pontos." aparece no Bonzi, mas sem voz (o número
  não tem gravação e caía na voz do navegador). Nova opção `say(msg, estado, { silent: true })` (`SayOptions.silent`
  → `useBonziLine` → `NarratorLine.silent` → `Narrator`/`BonziBuddy silent`). Depois, a pedido da equipe, o fim de aula
  ("Aula concluída! Você mandou muito bem.") também ficou só escrito.
- **Tela tremendo / indo para a direita** (G2: página do sistema concluído; "Quer entrar?" do mapa): o anel do botão
  `attention` (`SpriteButton`) crescia com `scale(1.12, 1.35)`. No pé da tela ele passava da borda da janela em até
  9 px a cada pulso; a página ganhava rolagem, a barra aparecia e sumia (15 px) e o conteúdo centralizado pulava de
  lado a cada 1,3 s. Medido em 1280x680 (largura alternando 1265/1280). Agora o anel pulsa só na opacidade, parado a
  10 px do botão (dentro dos 14 px de margem do layout); depois da correção: largura fixa e 0 px de sobra.
  Regra: animação infinita perto da borda não deve crescer para fora (transform conta na área de rolagem).

## Versão online no Render (24/10/2026)
Pedido: publicar o Rota no Render (grátis) e, depois, trocar a versão online por esta pasta (`C:
otas_fdss`).
- **No ar:** site https://rota404.onrender.com (estático, CDN, não dorme) + API https://rota404-api.onrender.com
  (serviço web grátis: dorme após 15 min, ~1 min para acordar). Blueprint `rota404` no Render, a partir do GitHub
  `Jhonny-Freire/rota-404_v2` (público, sem `.env`); cada push na `main` republica.
- **Frontend:** `next.config.ts` liga `output: "export"` + `trailingSlash` só com `STATIC_EXPORT=1` (o build normal
  para `next start` continua igual). As 4 rotas dinâmicas ganharam `generateStaticParams` lendo `seed.json`
  (`lib/staticParams.ts`); galáxia e sistema viraram `GalaxyPage.tsx`/`SystemPage.tsx` (cliente) com uma `page.tsx` de
  servidor. `scripts/flatten-export-segments.mjs` corrige o export do Next 16 (segmentos de prefetch gravados em
  pastas e pedidos com pontos). `SessionGate` tira a "/" final do caminho (senão `/entrar/` não era pública e a
  tela ficava em branco).
- **Render:** `render.yaml` com reescritas por rota (`/aulas/*` → `/aulas/*/index.html`, `/entrar` etc.), porque o
  Render não completa a barra final; o resto vai para `/404.html`.
- **Backend:** `gunicorn==23.0.0` + `backend/gunicorn.conf.py` (1 processo, 8 threads, mesmo pré-aquecimento do
  `run.py`). 1 processo também mantém o bloqueio de login (memória) consistente. No Windows continue com `run.py`.
- **Testado:** typecheck, build estático e normal, 140 testes, gunicorn no WSL (Python 3.12.3, cache 44/44), site
  estático local com API local (cadastro, volta para a página pedida, aula 1.1, ranking, nenhum arquivo faltando).
- **Conquistas no Supabase:** as 19 linhas da migration `20261024000000_achievements.sql` (mesmos dados do
  `seed.json`) foram gravadas pela API REST com a chave do backend (upsert por id); API do Render reiniciada para
  limpar o cache. Conteúdo novo no Supabase só aparece no Render depois de reiniciar a `rota404-api`.
- **Pendente:** monitor (UptimeRobot) em `/api/health` nas horas da feira.

