<!-- Escrito em 22/10/2026, ao implementar a Galáxia 2. Se o código mudar, atualize este arquivo. -->
# Ficha técnica: MOTORES da Galáxia 2 "API REST" (faixa 14-ou-mais)

Especificação: `random/G2 - API REST/faixa14-completa.md` (um arquivo só com os 16 planetas; é a fonte da verdade do
conteúdo). O contrato, os shells e o kit são os mesmos da Galáxia 1 (`runtime-shells-e-kit.md`, `motores-g1.md`).

## 1. Os 16 planetas (seed.json, seed.sql e Supabase — inseridos em 22/10/2026)

Chave do motor = slug do planeta = `content.engine`/`config.engine` = pasta em `frontend/components/learning/engines/`.
Sistemas: `conhecendo-uma-api` (1.x), `requisicoes-http` (2.x), `entendendo-os-dados` (3.x), `api-em-situacoes-reais` (4.x).

| Código | Nome | Tipo (config.type) | Chave do motor | Id do planeta |
|---|---|---|---|---|
| 1.1 | Sistemas que conversam | lesson | sistemas-que-conversam | 3739933a-a082-4804-aba0-50b01eb107db |
| 1.2 | Cliente, servidor e API | lesson | cliente-servidor-e-api | 1a285845-406e-49f0-b277-fbaf0b67de40 |
| 1.3 | Faça uma pergunta ao servidor | lab (simulacao) | faca-uma-pergunta-ao-servidor | 4e4fd5b0-378e-41fc-a70b-fd00bbeac2e7 |
| 1.4 | O servidor respondeu! | lab (ordenacao) | o-servidor-respondeu | eb4e93f1-ad84-45f6-88e8-a55ceffcfdc8 |
| 2.1 | Como pedir uma informação | lesson | como-pedir-uma-informacao | 7d2a3449-4ff3-4bbf-bd9e-b112e2b5ada5 |
| 2.2 | GET, POST, PUT e DELETE | lesson | get-post-put-e-delete | d64b7f61-e194-4960-9d77-552f65417bda |
| 2.3 | Qual método devo usar? | lab (classificacao) | qual-metodo-devo-usar | e2114262-1e79-4024-8eae-eafa824b4b38 |
| 2.4 | Encontre o problema | lab (depuracao) | encontre-o-problema | 43cd040e-ca79-471d-81c7-397968022201 |
| 3.1 | O que é JSON? | lesson | o-que-e-json | e4901402-6a32-405a-8f16-3693c89f27d4 |
| 3.2 | Lendo uma resposta | lesson | lendo-uma-resposta | 23907197-ee1b-4180-b97b-bc940f7bab89 |
| 3.3 | Caça ao dado | lab (investigacao) | caca-ao-dado | c10c30b4-85d9-4783-ae40-d98e3f2d58d3 |
| 3.4 | Monte a resposta | lab (mapeamento) | monte-a-resposta | bfb4a799-723d-4b25-9b6a-9b33a3c66a42 |
| 4.1 | API em um aplicativo | lesson | api-em-um-aplicativo | 256ae835-7863-4000-aa6a-9e10993be329 |
| 4.2 | Quando algo dá errado | lesson | quando-algo-da-errado | 2a2d6d5b-1193-49b3-8795-1d3a8b1ec7f0 |
| 4.3 | Diagnóstico da API | lab (diagnostico) | diagnostico-da-api | 1cd7f6b7-4b88-4d13-aa09-05e77becb22a |
| 4.4 | Desafio final: missão API | lab (desafio) | desafio-final-missao-api | c0913541-0271-43de-ae01-5d9fa1a2fcf8 |

URLs: `/aulas/<id>?sistema=<slug do sistema>` e `/laboratorios/<id>?sistema=...`. Os 16 estão registrados em
`engines/index.ts`. `central_idea` das aulas = "Ideia central" do .md. `max_score` = 10000 (pontuação nova da equipe);
tempos min/avg dos labs G2 em `frontend/config/labTiming.ts` (estimativas, calibrar).

## 2. Módulo compartilhado `engines/_api/` (não é motor; não registrar)

- `parts.tsx`: `Starfield`, `Live`, `Banner` (StageBanner y=8, sem região viva), `Node` (sprite centrado em `at`, com
  `badge` = sprite pequeno em cima e `aspect` para sprites não quadrados — o `plug` é 9/16), `Wire`, `Traveler`
  (mensagem que desliza; tom request/response/error), `AppCard` + `AppValue` (janela de aplicativo, cliente),
  `WorkPanel` (painel "Consultando dados" acima do servidor), `Code` (fonte monoespaçada).
- `World.tsx` → `ApiWorld`: app (esquerda) → API (meio) → servidor/serviço (direita), com `step` de −1 a 8 (pedido vai,
  servidor consulta, resposta volta, app mostra o valor). Opções: `withApi=false` (cena sem API, "?" no meio), `roles`
  (etiquetas CLIENTE/API/SERVIDOR), `focus`, `looks`, `onTap` (toque nas peças), `bare` (sem os nomes "API"/"Servidor",
  para o aluno identificar), `lost` (a resposta se perde no passo 6: ligação quebrada). Usado em 1.1, 1.2, 1.3 e 1.4.
- `MatchBoard.tsx`: associação cartão → caixa (DragProvider; arrastar, tocar-tocar ou Enter). Caixa errada recusa o
  cartão e o Bonzi diz o que a CAIXA precisa (`need`), sem revelar a resposta. `explain(piece)` troca a fala do acerto
  por uma explicação própria (4.2). Usado em 1.1, 2.2, 4.1 (duas vezes) e 4.2. No celular os cartões ficam numa fileira
  compacta abaixo da faixa.
- `http.tsx`: `MethodTag` (GET ciano, POST amarelo, PUT roxo, DELETE vermelho), `UrlBar` (URL em partes com destaque),
  `RequestLine` (MÉTODO + caminho), `StatusBadge` (2xx verde, 4xx amarelo, 5xx vermelho), `Catalog` (tabela fictícia
  com estados lit/new/changed/removed), `SummaryCards` (resumo do fechamento).
- `Json.tsx`: `jsonLines(valor, expandidos)` → linhas com tokens (chave, texto, número, booleano, null, pontuação,
  "{ 3 campos }"/"[ 3 itens ]" para abrir); `JsonView` com `tappable` (quais partes o aluno pode tocar), `onTap`,
  `onToggle`, `marks` (ok/wrong/hint por caminho; chave = `key:<caminho>`), `highlight` (linhas) e `showPunct` (acende
  aspas, dois-pontos, vírgulas, chaves e colchetes). Caminhos: `produto.preco`, `produtos[1].nome`. A altura é limitada
  ao palco (rola por dentro). Para um JSON INVÁLIDO (3.1), monte as linhas à mão (`Tok` com `kind: "missing"`).
- `timing.ts`: `READY_PAUSE_MS`, `MOVE_MS`, `REPEAT_LINE_MS`, `speechMs`, `phases` (iguais aos da G1).
- `ApiKit.module.css`: estilos de tudo acima (inclusive JSON, métodos, status e o MatchBoard).

Sprites novos (pixel art no mesmo estilo dos elementos, desenhados por script): `weather`, `card`, `map`, `gamepad`,
`plug` (a API), `store`, `receipt` — PNGs em `frontend/public/sprites/elements/` e chaves em `ELEMENTS`.

## 3. Padrões usados (além dos da G1)

- Falas do Bonzi: as que o .md põe entre aspas são LITERAIS (`LINES` em cada `model.ts`). Onde o .md só descreve o que o
  Bonzi explica, a fala segue o texto do .md de perto; onde não há nada (Microinterações, labs), as falas são criadas e
  marcadas como "criadas" no código.
- Falas encadeadas pelo fim REAL do áudio com `useSpeech` (2.2 cena 1, 3.1 cenas 2–3, 3.2 cena 2) — nada corta o Bonzi.
- Aulas: um subcomponente por cena com `key`; Microinteração no fim, Fechamento como última cena (como na G1).
- Labs: `Phase` + `phaseRef`, `guide(spec, fala)`, `mistake()` só em erro real (com explicação), `setStep(meta.steps
  .length)` antes do `finish`. Variação por `attempt` com `useSeededRandom`; na 1ª tentativa, o exemplo do .md.
- Nada de setas Unicode na UI (só em comentários): setas são `SPRITES.ui.next/back`.

## 4. Planeta a planeta (decisões e interpretações)

- **1.1** 7 cenas (as 5 do .md + Microinteração + Fechamento). App de clima → API (`plug`) → serviço meteorológico;
  Osasco — 24 °C. Microinteração: MatchBoard serviço → app; ao concluir, a comunicação do clima é animada. Texto criado:
  as etiquetas "Como fazer o pedido / Como receber o resultado" (Cena 2).
- **1.2** 7 cenas. Cena 5 sem fala no .md: fala criada a partir do texto ("a API costuma ser disponibilizada pelo
  serviço no servidor…"). Microinteração: tocar em cliente/API/servidor nas 3 perguntas e depois na requisição e na
  resposta (mensagens com a direção). O botão do app não diz "cliente" no nome acessível (entregaria a resposta).
  Revisão 24/10: o motivo do acerto aparece ESCRITO no palco por 3,2 s (`why`, sem fala nova); toques nesse tempo ou
  numa peça já descoberta não contam como erro (antes o 2º toque na mesma peça dava "Ainda não").
- **1.3** Etapas: escolher (clima, produto ou jogador; dá para trocar), CONSULTAR, resposta (dados mudam a cada
  tentativa; o 1º do clima é o do .md), etiquetas (DragProvider entre o palco e o painel). Erro de etiqueta: o Bonzi
  explica a função da parte (sem dizer o nome) e conta erro.
- **1.4** Ordenar os 4 cartões (no palco), reprodução da sequência, abrir REQUISIÇÃO/RESPOSTA ("Consultar produto 42" /
  "Produto encontrado"), rodada alternativa com a resposta perdida (`lost`) e "O que está faltando?" (2 alternativas
  criadas). Cada cartão fora de ordem tem uma explicação (criada). Revisão 24/10: `OrderCards uniform` (mesma largura,
  ícones na mesma altura, nomes alinhados).
- **2.1** URL em partes com os textos do .md; endpoints /users/42 × /products/42; GET /users/42. Microinteração digitada
  (`checkPath`): diz se o erro está no recurso, no número ou no formato; aceita sem barras e a URL completa.
  Revisão 24/10 (sem falas novas): Cena 1 — as três partes ficam escritas (uma a cada 4 s) e tocar numa destaca a parte
  na URL. Microinteração — endpoints viram botões (tocar escreve o caminho no campo: `AnswerInput fill`), exemplo
  `/users/42` e o molde `/recurso/número` escritos.
- **2.2** Cena 1 lê os 4 itens do .md e depois a fala (revisão 24/10: 1,5 s antes do 1º cartão e 2,5 s de leitura depois
  de cada um); Demonstração: catálogo fictício (GET destaca, POST cria o 4,
  PUT muda o preço do 1, DELETE risca e remove o 3) com "Reiniciar catálogo"; MatchBoard pedido → método.
- **2.3** 4 missões (uma por método, cada uma num recurso diferente; 16 missões criadas no estilo "Consulte o produto
  17"). Explicação do erro relaciona intenção e método; "Rever os métodos" mostra as intenções da 2.2 (sem custo).
  Revisão 24/10: o verbo da missão em destaque, a dica escrita no cartão e a lista marca o item citado (ou "+ novo item").
- **2.4** 4 rodadas na ordem de dificuldade do .md (método, endpoint, ID, mais de um). 1ª rodada da 1ª tentativa =
  exemplo do .md (Atualize o produto 42 com GET /products/42). Tocar nas partes mostra intenção/recurso/item; o
  diagnóstico diz onde está o problema (ou os problemas).
- **3.1** Cena 2 lê os 4 itens do .md com destaques no JSON; Microinteração (a) tocar objeto, chave, texto, número,
  booleano e lista; (b) escolher o exemplo válido (o inválido mostra em vermelho as aspas, a vírgula e a chave que faltam).
- **3.2** Microinteração: a 3ª pergunta do .md ("Qual produto tem este nome?") virou "Qual é o id do produto com o nome
  Mouse?" (o aluno abre a lista e toca no id) — interpretação.
- **3.3** 3 missões (principal, aninhado, lista). Tocar no valor e CONFERIR; erro destaca a chave relevante (uma a mais a
  cada erro), sem revelar o valor; acerto mostra o caminho (ex.: produtos → Teclado → preco, com setas sprite).
- **3.4** Modelos do .md (produto, perfil, placar) giram a cada "Jogar de novo". O aluno pode pôr qualquer valor em
  qualquer campo e trocar; CONFERIR marca os campos trocados (um erro por conferência). O monte fica na área de
  interação (no celular as peças não cabiam no palco).
- **4.1** 6 cenas. Cena 4 (limites): "Previsão de hoje" oferecida × "Lista de todos os usuários" não oferecida (criado).
  Microinteração: MatchBoard solicitação → serviço e depois o diagrama cliente/API/serviço.
- **4.2** 5 cenas de status com as falas literais + Microinteração (explicação a cada acerto) + Fechamento (texto do .md
  vira a fala).
- **4.3** 4 casos (são as etapas). Abrir REQUISIÇÃO/RESPOSTA; "O que aconteceu?" com 3 causas (a do .md + 2 criadas);
  próxima ação: 404 e 500 com 3 opções (a do .md + 2 criadas); 400: tocar no campo vazio e enviar de novo (200);
  401: entrar na conta simulada (sem senha) e repetir (200). Dados mudam a cada tentativa. Revisão 24/10: o próximo caso
  só vem quando a criança toca em "Próximo caso" (era automático em 3,2 s); botões da conta um embaixo do outro.
- **4.4** 5 etapas do .md. O ID errado já vem digitado (Etapa 1 do .md: /products/999); o aluno escolhe GET e
  /products/; 404 → explicação → corrige o ID → 200 → toca em nome e preco → arrasta para o cartão. Erros em qualquer
  etapa contam. Conquistas opcionais do .md NÃO implementadas (conquistas seguem 501).

## 5. Testar

- Backend com conta em memória: config `g2-backend` (porta 9012, `DATA_SOURCE=local`) + `g2-frontend` (next dev na
  9011 apontando para a 9012) em `.claude/launch.json`. Crie uma conta de teste em /entrar (idade 14+ abre API REST).
  Para abrir planetas fora de ordem: "Liberar todos os planetas" (Ajustes) — restaure depois.
- Com o painel do navegador oculto, animações CSS ficam paradas (faixa e cartões parecem sumir nos prints): é do
  navegador, não do motor.
