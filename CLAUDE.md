# Rota 404 — contexto do projeto para o Claude Code

Plataforma educacional de TI para crianças e adolescentes (8–16 anos), tema **exploração espacial em pixel art**,
feita para uma **feira de tecnologia** de faculdade (segunda versão do projeto). Faixa etária → universo,
galáxia → módulo, sistema planetário → assunto, planeta → aula ou laboratório. O aluno viaja num foguete e o
co-piloto **Bonzi Buddy** narra e orienta tudo. Responda e escreva a UI sempre em **português do Brasil**.

## Leia antes de trabalhar
| Arquivo | Quando ler |
|---|---|
| `.claude/contexto/historico-e-decisoes.md` | SEMPRE na primeira sessão: o que já foi feito, por quê, e as pendências |
| `.claude/contexto/motores-g1.md` | Antes de criar/alterar uma aula ou laboratório (tabela dos 16 planetas, padrões, passo a passo) |
| `.claude/contexto/runtime-shells-e-kit.md` | Contrato dos motores, shells (LessonShell/LabShell) e todas as primitivas do kit de cena |
| `.claude/contexto/frontend.md` | Páginas, providers/localStorage, API client, assets, fontes, componentes |
| `.claude/contexto/backend-e-dados.md` | Endpoints, variáveis de ambiente, cache/fallback, schema, seeds, testes |
| `.claude/contexto/desempenho.md` | Antes de mexer em animação, arraste ou carregamento (regras medidas — não reverta) |
| `prompt_base (1).md`, `resumo (1).md` | Requisitos originais da base e visão geral pedagógica |
| `G1 - Internet e Web/S*/*.md` | Especificação pedagógica de CADA planeta (fonte da verdade do conteúdo) |

Comandos prontos: `/implementar-planeta <código>` (ex.: `/implementar-planeta 3.1`) e `/receber-versao`.

## Como a equipe trabalha (importante)
- O projeto **não usa git**. Ele vai e volta como **zip da pasta inteira** entre os membros da equipe (Google Drive).
  Cada um refina o que precisa e devolve; o outro continua em cima da versão recebida.
- **A versão recebida é a base oficial.** Preserve as melhorias de quem enviou; não reverta nada sem motivo técnico
  forte e explicado. Ao receber uma versão nova, rode `/receber-versao` (reinstala dependências, compara com o zip
  anterior se existir, roda testes).
- O zip não deve levar `frontend/node_modules`, `frontend/.next`, `backend/.venv`/`venv`, `__pycache__` — recrie-os.
- `backend/.env` contém a **chave secreta do Supabase (service_role)** e costuma viajar no zip: nunca a copie para
  documentação, logs ou commits; mantenha o zip só entre a equipe. Recomendação forte: versionar com git (mesmo local).
- Membros usam Python diferentes (3.12 e 3.14) e Windows/WSL: **todo código Python precisa rodar em 3.12**.
- No fim de cada rodada, atualize `.claude/contexto/historico-e-decisoes.md` (o que mudou, decisões, pendências).

## Como rodar (Windows; o caminho tem espaços e acentos → use aspas)
```powershell
# backend (Python 3.12+)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Linux/WSL: source .venv/bin/activate
pip install -r requirements.txt
Copy-Item .env.example .env           # só se não existir; preencha SUPABASE_URL/SUPABASE_KEY ou use DATA_SOURCE=local
python run.py                          # http://127.0.0.1:5000/api/health  (pré-aquece o cache em segundo plano)

# frontend (Node 20.9+)
cd frontend
npm install
npm run dev                            # http://localhost:3000 (desenvolvimento)
npm run build ; npm start              # PRODUÇÃO — use na feira (dev pesa 6–7x mais). Build precisa de internet (fontes)
```
- Testes: `cd backend; python -m unittest discover -s tests` (110 testes) e `cd frontend; npm run typecheck`
  (não há ESLint nem testes de frontend).
- Sem Supabase: `DATA_SOURCE=local` usa `backend/app/data/seed.json` (cópia fiel do banco). Com o Supabase fora do ar,
  a API cai sozinha para o seed (`FALLBACK_TO_LOCAL=1`, padrão).
- Versão online no Render: `render.yaml` + seção "Publicar no Render" do README. Build estático local:
  `STATIC_EXPORT=1` + `npm run build` + `node scripts/flatten-export-segments.mjs` (gera `frontend/out/`).
  Rotas dinâmicas novas precisam de `generateStaticParams` (ver `frontend/lib/staticParams.ts`): a `page.tsx` é
  servidor e renderiza o componente cliente da mesma pasta.
- Tablets na rede da feira: `HOST=0.0.0.0` e `CORS_ORIGINS` com `http://<IP>:3000` no `backend/.env`, frontend em
  build+start, portas 3000/5000 liberadas no firewall (ver README). Não defina `NEXT_PUBLIC_API_URL=localhost`.

## Estrutura
```
frontend/   Next.js 16.4 (App Router), React 19.3, TypeScript strict, CSS Modules — TODAS as páginas "use client"
  app/                      rotas: / , /faixas-etarias, /galaxias, /galaxias/[slug], /sistemas/[slug],
                            /aulas/[planetId]?sistema=, /laboratorios/[planetId]?sistema=, /perfil, /conquistas,
                            /ranking, /configuracoes, 404
  components/learning/      shells de aula/lab, runtime/ (contrato e carregamento dos motores), kit/ (primitivas de
                            cena), engines/<slug>/ (UM motor por planeta) + engines/index.ts (registro)
  config/assets.ts          ÚNICA fonte de caminhos de imagem (SPRITES, ELEMENTS, PLANET_SPRITES, BONZI_FRAMES…)
  hooks/ lib/ services/     progresso local, settings, apiClient com cache, narração (voz do navegador)
backend/    Flask 3.1: routes → controllers → services → repositories → DataSource (Supabase | local | cache)
supabase/   migration (espelha o banco real) + seed.sql (catálogo); backend/app/data/seed.json é o MESMO conteúdo
assets/  sprites geral/   arte original (pixel art); a usada pelo app está copiada em frontend/public
G1 - Internet e Web/      especificações (.md) dos 16 planetas da galáxia 1
```

## Regras de ouro (não negociáveis)
1. **UI só com sprites/imagens PNG** via `frontend/config/assets.ts`. Proibido: bibliotecas de ícones, emojis,
   caracteres Unicode usados como ícone (✓ → ★ ▶ …), SVG desenhando sprite. Setas e checks nas cenas são sprites
   (`SPRITES.ui.next`, `ELEMENTS.ok`). Formas e maquetes em CSS (fios, blocos de página) são permitidas.
   Sprite novo: PNG em `frontend/public/...` + constante em `assets.ts`. Pixel art em escala inteira, `pixelated`.
2. **Conteúdo pedagógico segue o `.md` do planeta FIELMENTE**: cenas/etapas na ordem, falas do Bonzi LITERAIS,
   textos de feedback literais. Interpretações próprias devem ser registradas (ver `motores-g1.md`).
3. **Arquitetura**: Flask é o único backend (nada de API routes no Next). Controllers finos, sem acesso a dados.
   Supabase só para LEITURA do catálogo; progresso/pontos ficam no `localStorage` do navegador.
4. **Nunca** `text-transform: uppercase` com a fonte display (Press Start 2P, inclusive h1–h4): ela deforma
   maiúsculas acentuadas ("LABORATóRIO"). Caixa alta só com a fonte do corpo (Pixelify Sans).
5. **Desempenho** (o público usa notebook fraco): animação infinita só com `transform`/`opacity`; nada de setState por
   pointermove/quadro/letra; sem `backdrop-filter`; lógica temporizada por `setTimeout` (`useSequence`/`useTimers`),
   nunca por `animationend`/rAF; respeitar movimento reduzido. Detalhes em `.claude/contexto/desempenho.md`.
6. **Motores**: chave = `content.engine`/`config.engine` = slug do planeta = pasta = chave em `engines/index.ts`.
   Não registre stub (vira "real" e libera o próximo planeta). Sem `Math.random` no render (`useSeededRandom`).
7. **Seeds duplicados**: mudou o catálogo? Atualize `supabase/seed.sql` E `backend/app/data/seed.json` (mesma ordem de
   colunas — os testes conferem) E o Supabase. Não troque UUIDs de planetas (o progresso local usa esses ids).
8. **Python 3.12**: não remova `from __future__ import annotations` de `backend/app/repositories/data_source.py`.
9. Acessibilidade: tudo operável por toque, mouse e teclado; arrastar sempre com alternativa toque-toque/Enter;
   `aria-label`/`alt` em pt-BR; foco visível. Responsivo: desktop 1280–1920 primeiro, tablet e celular sem rolagem
   horizontal.
10. Nada de segredos no código. Sem dependências novas sem necessidade real. Comentários escassos, nomes em inglês,
    textos de UI em português.

## Estado atual (17/10/2026)
| Parte | Situação |
|---|---|
| Base (páginas, mapas, HUD, Bonzi, perfil, ajustes, 404) | pronta |
| Galáxia 1 "Internet e Web" (faixa 13-ou-menos) — S1 Dispositivos e conexão (1.1–1.4) | **pronta e testada** |
| S2 Endereços e sites (2.1–2.4) | **pronta e testada** |
| S3 Navegador e páginas Web (3.1–3.4) e S4 Comunicação e segurança (4.1–4.4) | especificação pronta; motores são **stubs** (abrem em "Prévia") |
| Galáxia 2 "API REST" (faixa 14-ou-mais) | 4 sistemas sem planetas no banco (mostram prévias) |
| Progresso/pontuação | só local (`rota404.progress`), desbloqueio sequencial por sistema; "Liberar todos os planetas" em Ajustes |
| Conquistas, ranking, usuários, progresso no servidor | endpoints respondem **501** (só estrutura) |
| Desempenho | otimizado e medido (55–60 FPS em notebook fraco simulado) |
| Versão online (Render) | preparada (`render.yaml`, site estático + API com gunicorn), testada localmente; deploy ainda não feito |

## Próximos passos prováveis
1. Implementar o **S3** (3.1, 3.2, 3.3, 3.4) e depois o **S4** com `/implementar-planeta`, um planeta por vez,
   testando cada um no navegador. O kit já tem `BrowserFrame`, `PagePreview`/`Block`/`BLOCK_TAGS`, `ChoiceGrid`,
   `OrderCards`, `AnswerInput` e `DragProvider` prontos para esses planetas.
2. Pendências abertas (detalhes no histórico): decisão do microteste da 1.1; layout de celular (≤ 375 px) dos labs
   2.3/2.4/1.4 e do microteste 2.1; altura variável da fala no painel do Bonzi dos labs; testar tablets reais na rede.
3. Antes de implementar gamificação no servidor, alinhar `backend/app/models/gamification.py`/`user.py` ao schema real.

## Como verificar antes de devolver o zip
- `npm run typecheck` (frontend) e `python -m unittest discover -s tests` (backend) sem erros; `npm run build` passando.
- Jogar no navegador cada planeta alterado: todas as cenas/etapas, um erro e depois o acerto, conclusão, "Jogar de
  novo" (variação diferente), progresso salvo e "Próximo planeta"; em 1440x900, tablet e 375 px; com "Reduzir
  animações" ligado; só com teclado.
- O `localStorage` do navegador (`rota404.progress`, `rota404.settings`, `rota404.explorer`) é compartilhado entre abas:
  ao testar, salve e restaure o do usuário.
- Atualize `.claude/contexto/historico-e-decisoes.md` e, se mudou contrato/kit/API, o arquivo de contexto correspondente.

## Pegadinhas do ambiente
- Pasta dentro do OneDrive com espaços e acentos: sempre aspas; `node_modules` dentro do OneDrive deixa tudo lento.
- `next/font/google` baixa as fontes no build/dev: sem internet o dev mostra fonte de reserva (Arial esticada) até
  reiniciar com rede.
- `next dev` recusa acesso de outros aparelhos (não há `allowedDevOrigins`): para tablets use build+start.
- Cache do catálogo: 1 h no Flask + 5 min no navegador. Conteúdo novo no Supabase só aparece após reiniciar a API e
  recarregar a página.
- Aba oculta não desenha quadros (rAF e animações CSS pausam): para medir FPS, a aba precisa estar visível.
